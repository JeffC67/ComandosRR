#!/usr/bin/env node
/* ==========================================================
   Seed Enlaces — Sección Aplicaciones (catálogo PortalAppsIndra)
   Deja la colección `enlaces` replicable en otro entorno con un
   solo comando: asegura esquema (colección + campos + permisos) y
   siembra el catálogo de scripts/data/enlaces.json.
   Uso:
     npm run seed:enlaces          siembra lo que falte (idempotente)
     npm run seed:enlaces -- --check   informa deriva sin escribir
     npm run seed:enlaces -- --force   borra todo y resiembra
   ========================================================== */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ARGS = process.argv.slice(2);
const CHECK = ARGS.includes('--check');
const FORCE = ARGS.includes('--force');

function loadEnv() {
  const env = {};
  for (const line of readFileSync(resolve(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

const env = loadEnv();
const BASE = process.env.DIRECTUS_URL || `http://127.0.0.1:${env.DIRECTUS_PORT || 8056}`;
let token = null;

async function api(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers },
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  return { ok: res.ok, status: res.status, json };
}

async function login() {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.DIRECTUS_ADMIN_EMAIL || env.DIRECTUS_ADMIN_EMAIL,
      password: process.env.DIRECTUS_ADMIN_PASSWORD || env.DIRECTUS_ADMIN_PASSWORD,
    }),
  });
  if (!res.ok) throw new Error('Login admin falló: revisa DIRECTUS_ADMIN_* en .env');
  token = (await res.json()).data.access_token;
}

const CAMPOS = [
  {
    field: 'categoria',
    type: 'string',
    meta: { interface: 'input', required: true, note: 'INDRA, HOGAR, MÓVIL…' },
    schema: { max_length: 60, is_nullable: false },
  },
  {
    field: 'grupo',
    type: 'string',
    meta: { interface: 'input', required: true },
    schema: { max_length: 120, is_nullable: false },
  },
  {
    field: 'nombre',
    type: 'string',
    meta: { interface: 'input', required: true },
    schema: { max_length: 120, is_nullable: false },
  },
  {
    field: 'url',
    type: 'string',
    meta: { interface: 'input', note: 'Vacía = se muestra sin navegar' },
    schema: { max_length: 1024, is_nullable: true },
  },
  { field: 'descripcion', type: 'text', meta: { interface: 'input-multiline' }, schema: {} },
  {
    field: 'orden',
    type: 'integer',
    meta: { interface: 'input', note: 'Orden dentro del grupo' },
    schema: { is_nullable: false, default_value: 0 },
  },
  {
    field: 'estado',
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      options: {
        choices: [
          { text: 'Publicado', value: 'publicado' },
          { text: 'Borrador', value: 'borrador' },
          { text: 'Archivado', value: 'archivado' },
        ],
      },
    },
    schema: { max_length: 20, is_nullable: false, default_value: 'publicado' },
  },
];

async function asegurarEsquema() {
  const col = await api('/collections/enlaces');
  if (!col.ok) {
    if (CHECK) throw new Error('Falta la colección enlaces (--check)');
    const r = await api('/collections', {
      method: 'POST',
      body: JSON.stringify({
        collection: 'enlaces',
        meta: {
          collection: 'enlaces',
          icon: 'apps',
          note: 'Catálogo de enlaces rápidos (PortalAppsIndra): sección Aplicaciones',
          display_template: '{{categoria}} · {{nombre}}',
          hidden: false,
          singleton: false,
          sort_field: 'orden',
          archive_field: 'estado',
          archive_value: 'archivado',
          unarchive_value: 'publicado',
          draft_value: 'borrador',
          versioning: false,
          collapse: 'open',
        },
        schema: {},
      }),
    });
    if (!r.ok) throw new Error('Crear colección: ' + JSON.stringify(r.json));
    console.log('  ✅ colección enlaces creada');
  }

  const fields = await api('/fields/enlaces');
  const hay = new Set(((fields.ok && fields.json.data) || []).map((f) => f.field));
  for (const c of CAMPOS) {
    if (hay.has(c.field)) continue;
    if (CHECK) throw new Error(`Falta el campo enlaces.${c.field} (--check)`);
    const r = await api('/fields/enlaces', { method: 'POST', body: JSON.stringify({ collection: 'enlaces', ...c }) });
    if (!r.ok) throw new Error('Crear campo: ' + JSON.stringify(r.json));
    console.log(`  ✅ campo ${c.field} creado`);
  }

  /* Espejo de `procesos`: Editor de contenido y Portal (servicio) con
     CRUD total; el aislamiento por rol vive en el servidor Next. */
  const pols = (await api('/policies?fields=id,name&limit=-1')).json.data;
  const pid = Object.fromEntries(pols.map((p) => [p.name, p.id]));
  const perms =
    (await api('/permissions?filter[collection][_eq]=enlaces&fields=policy,action&limit=-1')).json.data || [];
  const tiene = new Set(perms.map((p) => `${p.policy}:${p.action}`));
  for (const pname of ['Editor de contenido', 'Portal — solo lectura']) {
    for (const action of ['create', 'read', 'update', 'delete']) {
      if (tiene.has(`${pid[pname]}:${action}`)) continue;
      if (CHECK) throw new Error(`Falta permiso ${pname}/${action} (--check)`);
      await api('/permissions', {
        method: 'POST',
        body: JSON.stringify({
          policy: pid[pname],
          collection: 'enlaces',
          action,
          permissions: {},
          validation: null,
          presets: null,
          fields: ['*'],
        }),
      });
      console.log(`  ✅ permiso ${pname} ${action} creado`);
    }
  }
}

async function main() {
  console.log(`→ Seed enlaces (${BASE})${CHECK ? ' [--check]' : ''}${FORCE ? ' [--force]' : ''}\n`);
  await login();
  await asegurarEsquema();

  const semilla = JSON.parse(readFileSync(resolve(ROOT, 'scripts/data/enlaces.json'), 'utf8'));
  const key = (e) => `${e.categoria}|${e.grupo}|${e.nombre}`;
  const actuales =
    (await api('/items/enlaces?fields=id,categoria,grupo,nombre,url,descripcion,orden,estado&limit=-1')).json.data ||
    [];
  const porClave = new Map(actuales.map((e) => [key(e), e]));

  if (FORCE && !CHECK) {
    for (const e of actuales) await api(`/items/enlaces/${e.id}`, { method: 'DELETE' });
    porClave.clear();
    console.log(`  🗑 ${actuales.length} fila(s) borrada(s)`);
  }

  let creados = 0;
  const faltan = semilla.filter((s) => !porClave.has(key(s)));
  if (CHECK) {
    console.log(`  semilla: ${semilla.length} · en BD: ${actuales.length} · faltan: ${faltan.length}`);
    if (faltan.length > 0) {
      console.log('  ❌ deriva: ' + faltan.slice(0, 5).map(key).join(', ') + (faltan.length > 5 ? '…' : ''));
      process.exit(1);
    }
    console.log('  ✅ sin deriva');
    return;
  }
  for (const s of faltan) {
    const r = await api('/items/enlaces', {
      method: 'POST',
      body: JSON.stringify({
        categoria: s.categoria,
        grupo: s.grupo,
        nombre: s.nombre,
        url: s.url,
        descripcion: s.descripcion,
        orden: s.orden,
        estado: s.estado,
      }),
    });
    if (!r.ok) throw new Error('Sembrar: ' + JSON.stringify(r.json).slice(0, 200));
    creados++;
  }
  const total = (await api('/items/enlaces?limit=1&meta=total_count')).json.meta.total_count;
  console.log(`  ✅ creados: ${creados} · total en enlaces: ${total}`);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
