#!/usr/bin/env node
/* ============================================================
   Restore — seed/*.json → Directus
   Restaura el portal completo (esquema + contenido + acceso) en
   CUALQUIER Directus vacío (o completa uno a medias) a partir de
   los ficheros generados con `extract.mjs`. Es la "seed perfecta":
   desplegar en otro lado = apuntar las variables y ejecutar.

   Idempotente: sin --force reutiliza lo que ya existe (upsert por
   clave natural, sin borrar nada). Con --force vacía primero las
   tablas de contenido (borrado permanente, hijos antes que padres).

   Los IDs NUNCA se copian: cada fila se casa por clave natural
   (slug, (modulo,etiqueta), (proceso,orden), archivo,
   (categoria,grupo,nombre)) y las FK se reescriben a los IDs nuevos.
   Así no hay choques de secuencias en Postgres.

   Uso:
     DIRECTUS_URL=https://xxx.onrender.com \
     DIRECTUS_ADMIN_EMAIL=admin@... \
     DIRECTUS_ADMIN_PASSWORD=... \
     DIRECTUS_SERVICE_PASSWORD=... \
     node seed/restore.mjs [--force]
   DIRECTUS_SERVICE_PASSWORD solo se usa si hay que CREAR la cuenta
   de servicio; si ya existe no se toca (nunca se imprimen secretos).
   Sin DIRECTUS_URL usa el .env de la raíz (puerto local 8056).
   ============================================================ */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SEED, '..');
const FORCE = process.argv.includes('--force');

/* ---------- Entorno ---------- */
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
const SERVICE_PASSWORD = process.env.DIRECTUS_SERVICE_PASSWORD || env.DIRECTUS_SERVICE_PASSWORD;
if (!EMAIL || !PASSWORD) throw new Error('Falta DIRECTUS_ADMIN_EMAIL / DIRECTUS_ADMIN_PASSWORD');

/* Cuentas que gestiona la seed (las demás — admin incluido — no se tocan).
   Solo se asigna password al CREAR; un usuario existente conserva la suya. */
const MANAGED_USERS = [
  { email: 'portal@capacitacion-rr.co', role: 'Portal', first_name: 'Portal', password: () => {
      if (!SERVICE_PASSWORD) throw new Error('Falta DIRECTUS_SERVICE_PASSWORD para crear la cuenta de servicio');
      return SERVICE_PASSWORD;
    } },
  { email: 'editor@capacitacion-rr.co', role: 'Editor', first_name: 'Editor', password: () => 'EditorTest123!' },
  { email: 'agente.prueba@capacitacion-rr.co', role: 'agente', first_name: 'Agente', last_name: 'Prueba', password: () => 'AgenteTest123!' },
];

/* ---------- HTTP con reintentos ---------- */
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
      if (res.ok) return json; // 204 sin cuerpo (DELETE) también es éxito
      last = new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
      if (res.status >= 400 && res.status < 500 && res.status !== 429) throw last;
    } catch (e) {
      last = e;
      if (/HTTP 4/.test(e.message)) throw e;
    }
    if (i < tries) await sleep(8000);
  }
  throw new Error(`${options.method || 'GET'} ${path} falló tras ${tries} intentos: ${last?.message}`);
}

let token = null;
const auth = () => ({ Authorization: `Bearer ${token}` });
const get = (path) => fetchJSON(path, { headers: auth() }).then((r) => r.data);
const post = (path, body) => fetchJSON(path, { method: 'POST', headers: auth(), body: JSON.stringify(body) }).then((r) => r.data);
const patch = (path, body) => fetchJSON(path, { method: 'PATCH', headers: auth(), body: JSON.stringify(body) }).then((r) => r.data);
const del = (path) => fetchJSON(path, { method: 'DELETE', headers: auth() });

/* ---------- Seed (ficheros) ---------- */
const readJson = (f) => JSON.parse(readFileSync(resolve(SEED, f), 'utf8'));
const SCHEMA = readJson('schema.json');
const ACCESS = readJson('access.json');
const DATA = {};
for (const c of Object.keys(SCHEMA.collections)) DATA[c] = readJson(`data/${c}.json`);
const CONTENT = Object.keys(SCHEMA.collections);

/* Clave natural por colección (con FK ya resueltos a IDs del destino) */
const keyPairsOf = {
  modulos: (r) => [['slug', r.slug]],
  categorias: (r) => [['slug', r.slug]],
  procesos: (r) => [['slug', r.slug]],
  comandos: (r) => [['modulo', r.modulo], ['etiqueta', r.etiqueta]],
  pasos: (r) => [['proceso', r.proceso], ['orden', r.orden]],
  videos: (r) => (r.archivo != null ? [['archivo', r.archivo]] : [['modulo', r.modulo], ['titulo', r.titulo]]),
  enlaces: (r) => [['categoria', r.categoria], ['grupo', r.grupo], ['nombre', r.nombre]],
};

function filterParams(pairs) {
  const p = new URLSearchParams();
  for (const [k, v] of pairs) {
    if (v === null || v === undefined) p.append(`filter[${k}][_null]`, 'true');
    else p.append(`filter[${k}][_eq]`, String(v));
  }
  p.append('limit', '5');
  return p.toString();
}

const sameRow = (existing, expected) =>
  Object.entries(expected).every(([k, v]) => (existing[k] ?? null) === (v ?? null));

/* ---------- Esquema ---------- */
const META_DROP = new Set(['id', 'collection']);
const SCHEMA_KEYS = new Set([
  'default_value', 'max_length', 'is_nullable', 'is_unique', 'numeric_precision', 'numeric_scale',
]);
const cleanMeta = (m) => Object.fromEntries(Object.entries(m ?? {}).filter(([k]) => !META_DROP.has(k)));
const cleanSchema = (s) =>
  Object.fromEntries(Object.entries(s ?? {}).filter(([k, v]) => SCHEMA_KEYS.has(k) && v !== null && v !== undefined));
/* Las FK las crean las relaciones (como setup-schema.mjs); el campo va plano */

async function ensureSchema() {
  console.log('\n[1/3] Esquema');
  const existentes = new Set((await get('/collections?limit=-1&fields=collection')).map((c) => c.collection));

  for (const name of CONTENT) {
    const meta = { ...SCHEMA.collections[name] };
    delete meta.collection;
    delete meta.status; // 'active' es el defecto; PATCH/POST con status es frágil
    if (!existentes.has(name)) {
      const createMeta = { ...SCHEMA.collections[name] };
      delete createMeta.collection;
      await post('/collections', { collection: name, meta: createMeta, schema: {} });
      console.log(`  colección creada: ${name}`);
      existentes.add(name);
    } else {
      await patch(`/collections/${name}`, { meta });
    }
  }

  for (const name of CONTENT) {
    const actuales = new Map((await get(`/fields/${name}`)).map((f) => [f.field, f]));
    for (const def of SCHEMA.fields[name]) {
      if (def.field === 'id') continue; // la crea la colección
      const actual = actuales.get(def.field);
      if (!actual) {
        await post(`/fields/${name}`, { field: def.field, type: def.type, meta: cleanMeta(def.meta), schema: cleanSchema(def.schema) });
        console.log(`  campo creado: ${name}.${def.field}`);
        continue;
      }
      if (actual.type !== def.type) {
        throw new Error(
          `${name}.${def.field} es ${actual.type} en destino y la seed pide ${def.type}. ` +
            `Corrígelo a mano o vacía la colección.`,
        );
      }
    }
  }

  const rels = new Set(
    (await get('/relations?limit=-1')).map((r) => `${r.collection}.${r.field}→${r.related_collection}`),
  );
  for (const r of SCHEMA.relations) {
    if (!rels.has(`${r.collection}.${r.field}→${r.related_collection}`)) {
      await post('/relations', r);
      console.log(`  relación creada: ${r.collection}.${r.field} → ${r.related_collection}`);
    }
  }
  console.log('  ✓ esquema');
}

/* ---------- Acceso ---------- */
async function ensureAccess(userEmailById) {
  console.log('\n[2/3] Acceso');
  const roles = new Map((await get('/roles?fields=id,name&limit=-1')).map((r) => [r.name, r.id]));
  for (const r of ACCESS.roles) {
    if (!roles.has(r.name)) {
      const created = await post('/roles', {
        name: r.name, ...(r.icon ? { icon: r.icon } : {}), ...(r.description ? { description: r.description } : {}),
      });
      roles.set(r.name, created.id);
      console.log(`  rol creado: ${r.name}`);
    }
  }

  const policies = new Map((await get('/policies?fields=id,name&limit=-1')).map((p) => [p.name, p.id]));
  for (const p of ACCESS.policies) {
    if (!policies.has(p.name)) {
      const created = await post('/policies', {
        name: p.name, ...(p.icon ? { icon: p.icon } : {}),
        ...(p.description ? { description: p.description } : {}),
        ...(p.admin_access !== undefined ? { admin_access: p.admin_access } : {}),
        ...(p.app_access !== undefined ? { app_access: p.app_access } : {}),
      });
      policies.set(p.name, created.id);
      console.log(`  policy creada: ${p.name}`);
    }
  }

  // Vínculos policy↔rol (se ignoran los de usuario y los de Administrator: vienen por defecto)
  const links = new Set(
    (await get('/access?limit=-1')).map((a) => `${a.role ?? ''}|${a.user ?? ''}|${a.policy}`),
  );
  for (const a of ACCESS.access) {
    if (!a.role || a.role === 'Administrator' || a.policy === 'Administrator') continue;
    const roleId = roles.get(a.role);
    const policyId = policies.get(a.policy);
    if (!roleId || !policyId) continue;
    if (!links.has(`${roleId}||${policyId}`)) {
      await post('/access', { role: roleId, policy: policyId });
      console.log(`  vínculo creado: ${a.role} ↔ ${a.policy}`);
    }
  }

  // Permisos: asegurar los de la seed; la policy pública queda vacía en este scope
  const existing = new Map(
    (await get('/permissions?limit=-1')).map((p) => [`${p.policy}|${p.collection}|${p.action}`, p]),
  );
  const wantPublic = new Set(
    ACCESS.permissions.filter((p) => p.policy === ACCESS.public_policy).map((p) => `${p.collection}|${p.action}`),
  );
  const publicId = policies.get(ACCESS.public_policy);
  let creados = 0, actualizados = 0, limpiados = 0;
  for (const p of ACCESS.permissions) {
    if (p.policy === ACCESS.public_policy || p.policy === 'Administrator') continue;
    const policyId = policies.get(p.policy);
    if (!policyId) continue;
    const key = `${policyId}|${p.collection}|${p.action}`;
    const body = { policy: policyId, collection: p.collection, action: p.action, permissions: p.permissions ?? {} };
    if (p.validation != null) body.validation = p.validation;
    if (p.presets != null) body.presets = p.presets;
    if (p.fields != null) body.fields = p.fields;
    const actual = existing.get(key);
    if (!actual) {
      await post('/permissions', body);
      creados++;
    } else if (
      JSON.stringify(actual.permissions ?? {}) !== JSON.stringify(body.permissions) ||
      JSON.stringify(actual.validation ?? null) !== JSON.stringify(body.validation ?? null) ||
      JSON.stringify(actual.presets ?? null) !== JSON.stringify(body.presets ?? null) ||
      JSON.stringify(actual.fields ?? null) !== JSON.stringify(body.fields ?? null)
    ) {
      await patch(`/permissions/${actual.id}`, body);
      actualizados++;
    }
  }
  if (publicId) {
    for (const [key, perm] of existing) {
      if (!key.startsWith(`${publicId}|`)) continue;
      const [, collection, action] = key.split('|');
      const enSeed = wantPublic.has(`${collection}|${action}`);
      if (!enSeed && (CONTENT.includes(collection) || collection === 'directus_files')) {
        await del(`/permissions/${perm.id}`);
        limpiados++;
      }
    }
  }
  console.log(`  ✓ permisos (creados ${creados}, actualizados ${actualizados}, públicos limpiados ${limpiados})`);

  // Usuarios gestionados (nunca se cambia la password de uno existente)
  const users = new Map((await get('/users?fields=id,email,role&limit=-1')).map((u) => [u.email, u]));
  for (const m of MANAGED_USERS) {
    const u = users.get(m.email);
    const roleId = roles.get(m.role);
    if (!u) {
      const created = await post('/users', {
        email: m.email, password: m.password(), role: roleId, status: 'active',
        ...(m.first_name ? { first_name: m.first_name } : {}),
        ...(m.last_name ? { last_name: m.last_name } : {}),
      });
      users.set(m.email, created);
      userEmailById[m.email] = created.id;
      console.log(`  usuario creado: ${m.email} (rol ${m.role})`);
    } else {
      userEmailById[m.email] = u.id;
      if (u.role !== roleId) {
        await patch(`/users/${u.id}`, { role: roleId });
        console.log(`  rol corregido: ${m.email} → ${m.role}`);
      }
    }
  }
  console.log('  ✓ acceso');
}

/* ---------- Datos (upsert por clave natural) ---------- */
const WIPE_ORDER = ['pasos', 'comandos', 'videos', 'procesos', 'categorias', 'modulos', 'enlaces'];
const LOAD_ORDER = ['modulos', 'categorias', 'comandos', 'procesos', 'pasos', 'videos', 'enlaces'];

async function vaciar(c) {
  for (let pasada = 0; pasada < 12; pasada++) {
    const { data, meta } = await fetchJSON(`/items/${c}?fields=id&limit=-1&meta=total_count`, { headers: auth() });
    const restantes = meta?.total_count ?? data.length;
    if (restantes === 0) break;
    for (const r of data) await del(`/items/${c}/${r.id}?permanent=true`);
    await sleep(800);
  }
  const meta = (await fetchJSON(`/items/${c}?limit=1&meta=total_count`, { headers: auth() })).meta;
  if ((meta?.total_count ?? 0) > 0) throw new Error(`No se pudo vaciar "${c}"`);
}

/* Resuelve FK de una fila seed → valores del destino. Devuelve {key, body}. */
function resolver(coll, row, maps) {
  const body = { ...row };
  delete body.id;
  if (coll === 'comandos') {
    body._modulo_slug = maps.modulos[body.modulo];
    if (!body._modulo_slug) throw new Error(`comando "${body.etiqueta}": modulo id ${body.modulo} sin slug en la seed`);
    body.modulo = maps.nuevos.modulos[body._modulo_slug];
  }
  if (coll === 'procesos') {
    body._categoria_slug = body.categoria == null ? null : maps.categorias[body.categoria];
    if (body.categoria != null && !body._categoria_slug) throw new Error(`proceso "${body.slug}": categoria id ${body.categoria} sin slug en la seed`);
    body.categoria = body.categoria == null ? null : maps.nuevos.categorias[body._categoria_slug];
    body._creado_email = body.creado_por == null ? null : maps.usuarios[body.creado_por];
    body.creado_por = body.creado_por == null ? null : (maps.nuevos.usuarios[body._creado_email] ?? null);
    delete body._categoria_slug; delete body._creado_email;
  }
  if (coll === 'pasos') {
    body._proceso_slug = maps.procesos[body.proceso];
    if (!body._proceso_slug) throw new Error(`paso id ${row.id}: proceso id ${body.proceso} sin slug en la seed`);
    body.proceso = maps.nuevos.procesos[body._proceso_slug];
  }
  if (coll === 'videos') {
    body._modulo_slug = body.modulo == null ? null : maps.modulos[body.modulo];
    body.modulo = body.modulo == null ? null : maps.nuevos.modulos[body._modulo_slug];
  }
  const pairs = keyPairsOf[coll](body);
  delete body._modulo_slug; delete body._proceso_slug;
  return { pairs, body };
}

async function ensureData(maps) {
  console.log('\n[3/3] Datos' + (FORCE ? ' (--force: vaciando primero)' : ''));
  if (FORCE) {
    for (const c of WIPE_ORDER) await vaciar(c);
    console.log('  tablas vaciadas');
  }
  const resumen = {};
  for (const coll of LOAD_ORDER) {
    let creados = 0, actualizados = 0, intactos = 0;
    for (const row of DATA[coll]) {
      const { pairs, body } = resolver(coll, row, maps);
      const found = (await get(`/items/${coll}?${filterParams(pairs)}`));
      if (found.length > 1) console.log(`  ⚠ ${coll}: clave duplicada en destino para ${JSON.stringify(pairs)}`);
      if (found.length === 0) {
        const created = await post(`/items/${coll}`, body);
        creados++;
        registrarMapa(coll, row, body, created, maps);
      } else {
        const actual = found[0];
        registrarMapa(coll, row, body, actual, maps);
        if (sameRow(actual, body)) intactos++;
        else {
          await patch(`/items/${coll}/${actual.id}`, body);
          actualizados++;
        }
      }
    }
    resumen[coll] = { creados, actualizados, intactos };
    console.log(`  ${coll}: +${creados} ~${actualizados} =${intactos}`);
  }
  return resumen;
}

/* Guarda id nuevo por clave natural (para resolver FK de los siguientes) */
function registrarMapa(coll, seedRow, resolvedBody, destRow, maps) {
  if (coll === 'modulos' || coll === 'categorias' || coll === 'procesos') {
    maps.nuevos[coll][seedRow.slug] = destRow.id;
  }
}

/* ---------- Main ---------- */
async function main() {
  console.log(`→ Destino: ${BASE}${FORCE ? ' (--force)' : ''}`);
  const login = await fetchJSON('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  }, 8);
  token = login.data.access_token;
  console.log('  login OK');

  await ensureSchema();

  // Mapas id-origen → clave natural (de la propia seed)
  const maps = {
    modulos: Object.fromEntries(DATA.modulos.map((r) => [r.id, r.slug])),
    categorias: Object.fromEntries(DATA.categorias.map((r) => [r.id, r.slug])),
    procesos: Object.fromEntries(DATA.procesos.map((r) => [r.id, r.slug])),
    usuarios: Object.fromEntries(ACCESS.users.map((u) => [u.id, u.email])),
    nuevos: { modulos: {}, categorias: {}, procesos: {}, usuarios: {} },
  };
  // Emails de destino (los UUID cambian; el email es la identidad estable)
  for (const u of await get('/users?fields=id,email&limit=-1')) maps.nuevos.usuarios[u.email] = u.id;

  await ensureAccess(maps.nuevos.usuarios);
  const resumen = await ensureData(maps);

  const totales = {};
  for (const c of CONTENT) {
    const meta = (await fetchJSON(`/items/${c}?limit=1&meta=total_count`, { headers: auth() })).meta;
    totales[c] = meta?.total_count ?? 0;
  }
  console.log('\n✅ Restore completado:', JSON.stringify(totales));
  console.log('   detalle:', JSON.stringify(resumen));
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
