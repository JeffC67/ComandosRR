#!/usr/bin/env node
/* ============================================================
   Extract — Directus → seed/*.json
   Vuelca el esquema (colecciones, campos, relaciones), el contenido
   y el control de acceso del Directus remoto a ficheros JSON
   versionables. Esos ficheros son la "seed perfecta": `restore.mjs`
   los aplica en cualquier otro Directus vacío y lo deja idéntico.

   No borra ni modifica nada en el origen: solo lee (GET).

   Uso (desde la raíz del repo o desde seed/):
     DIRECTUS_URL=https://xxx.onrender.com \
     DIRECTUS_ADMIN_EMAIL=admin@... \
     DIRECTUS_ADMIN_PASSWORD=... \
     node seed/extract.mjs
   Sin DIRECTUS_URL usa el .env de la raíz (puerto local 8056).

   Salida:
     seed/schema.json   colecciones + campos + relaciones
     seed/data/*.json   filas por colección (ordenadas por id)
     seed/access.json   roles, policies, permisos, vínculos y usuarios
   ============================================================ */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SEED, '..');
const DATA_DIR = resolve(SEED, 'data');

/* Colecciones del portal (el resto — directus_*, quiz borrado — no se versiona) */
const CONTENT = ['modulos', 'categorias', 'comandos', 'procesos', 'pasos', 'videos', 'enlaces'];

/* ---------- Entorno (.env de la raíz + overrides) ---------- */
function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(resolve(ROOT, '.env'), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2];
    }
  } catch {
    /* sin .env: todo por variables de entorno */
  }
  return env;
}

const env = loadEnv();
const BASE = (process.env.DIRECTUS_URL || `http://127.0.0.1:${env.DIRECTUS_PORT || 8056}`).replace(/\/$/, '');
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || env.DIRECTUS_ADMIN_EMAIL;
const PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || env.DIRECTUS_ADMIN_PASSWORD;
if (!EMAIL || !PASSWORD) throw new Error('Falta DIRECTUS_ADMIN_EMAIL / DIRECTUS_ADMIN_PASSWORD');

/* ---------- HTTP con reintentos (el free tier responde vacío a veces) ---------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJSON(path, options = {}, tries = 6) {
  let last = null;
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers },
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : null;
      if (res.ok && json) return json;
      last = new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    } catch (e) {
      last = e;
    }
    if (i < tries) await sleep(8000);
  }
  throw new Error(`GET ${path} falló tras ${tries} intentos: ${last?.message}`);
}

let token = null;
const auth = () => ({ Authorization: `Bearer ${token}` });
const get = (path) => fetchJSON(path, { headers: auth() }).then((r) => r.data);

/* ---------- Main ---------- */
async function main() {
  console.log(`→ Origen: ${BASE}`);
  const login = await fetchJSON('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  token = login.data.access_token;
  console.log('  login OK');

  /* ---- 1. Esquema ---- */
  const schema = { collections: {}, fields: {}, relations: [] };
  for (const c of CONTENT) {
    const col = await fetchJSON(`/collections/${c}`, { headers: auth() }).then((r) => r.data);
    schema.collections[c] = col.meta;
    schema.fields[c] = (await get(`/fields/${c}`)).map((f) => ({
      field: f.field,
      type: f.type,
      meta: f.meta,
      schema: f.schema ?? {},
    }));
    console.log(`  esquema ${c}: ${schema.fields[c].length} campos`);
  }
  const rels = await get('/relations?limit=-1');
  schema.relations = rels
    .filter((r) => CONTENT.includes(r.collection) || CONTENT.includes(r.related_collection))
    .map((r) => ({ collection: r.collection, field: r.field, related_collection: r.related_collection }));
  console.log(`  relaciones: ${schema.relations.length}`);
  writeFileSync(resolve(SEED, 'schema.json'), JSON.stringify(schema, null, 2) + '\n');

  /* ---- 2. Datos ---- */
  mkdirSync(DATA_DIR, { recursive: true });
  for (const c of CONTENT) {
    const rows = await get(`/items/${c}?limit=-1&sort=id`);
    writeFileSync(resolve(DATA_DIR, `${c}.json`), JSON.stringify(rows, null, 2) + '\n');
    console.log(`  datos ${c}: ${rows.length} filas`);
  }

  /* ---- 3. Acceso ---- */
  const roles = await get('/roles?fields=id,name,icon,description&limit=-1');
  const byId = Object.fromEntries(roles.map((r) => [r.id, r.name]));
  const policies = await get('/policies?limit=-1');
  const polById = Object.fromEntries(policies.map((p) => [p.id, p.name]));
  const permissions = await get('/permissions?limit=-1');
  const access = await get('/access?limit=-1');
  const users = await get('/users?fields=id,email,first_name,last_name,role,status&limit=-1');
  const accessDump = {
    roles: roles.filter((r) => r.name !== 'Administrator'),
    policies: policies.filter((p) => !['Administrator', 'Public'].includes(p.name)),
    public_policy: policies.find((p) => p.name === 'Public')?.name ?? 'Public',
    permissions: permissions
      .filter((p) => p.collection === 'directus_files' || CONTENT.includes(p.collection))
      .map((p) => ({
        policy: polById[p.policy] ?? p.policy,
        collection: p.collection,
        action: p.action,
        permissions: p.permissions ?? {},
        validation: p.validation ?? null,
        presets: p.presets ?? null,
        fields: p.fields ?? null,
      })),
    access: access.map((a) => ({
      role: a.role ? (byId[a.role] ?? a.role) : null,
      user: a.user ?? null,
      policy: polById[a.policy] ?? a.policy,
    })),
    users: users.map((u) => ({
      /* `id` solo sirve para resolver creado_por en restore; las
         contraseñas NUNCA se extraen (las pone restore por entorno) */
      id: u.id,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      role: byId[u.role] ?? u.role,
      status: u.status,
    })),
  };
  writeFileSync(resolve(SEED, 'access.json'), JSON.stringify(accessDump, null, 2) + '\n');
  console.log(
    `  acceso: ${accessDump.roles.length} roles, ${accessDump.policies.length} policies, ` +
      `${accessDump.permissions.length} permisos, ${accessDump.users.length} usuarios`,
  );

  console.log('\n✅ Extract completado en seed/');
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
