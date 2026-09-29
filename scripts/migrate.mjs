#!/usr/bin/env node
/* ==========================================================
   Migración del contenido (src/data/*.json) → Directus (Fase 1)
   Uso:
     node migrate.mjs            # aborta si ya hay datos
     node migrate.mjs --force    # borra los datos existentes y vuelve a migrar
   Variables: lee .env del proyecto (DIRECTUS_URL, admin, etc.)
   ========================================================== */

import { readFileSync, existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = resolve(ROOT, 'src/data');
const MEDIA_DIR = resolve(ROOT, 'public/media');
const FORCE = process.argv.includes('--force');

/* ---------- Entorno ---------- */
function loadEnv() {
  const env = {};
  const file = resolve(ROOT, '.env');
  if (!existsSync(file)) throw new Error('Falta .env en la raíz del proyecto');
  const txt = readFileSync(file, 'utf8');
  for (const line of txt.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

const env = loadEnv();
export const BASE = process.env.DIRECTUS_URL || `http://127.0.0.1:${env.DIRECTUS_PORT || 8056}`;

/* ---------- API ---------- */
let token = null;
export const getToken = () => token;

export async function api(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body && !(options.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...options.headers,
    },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`API ${options.method || 'GET'} ${path} → ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

export async function login() {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.DIRECTUS_ADMIN_EMAIL || env.DIRECTUS_ADMIN_EMAIL,
      password: process.env.DIRECTUS_ADMIN_PASSWORD || env.DIRECTUS_ADMIN_PASSWORD,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Login falló: ${JSON.stringify(json)}`);
  token = json.data.access_token;
}

/* ---------- Utilidades ---------- */
const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const clean = (s) => s.replace(/\s+/g, ' ').trim();

/* ---------- Lectura de src/data (fuente de verdad) ---------- */
const readJson = (file) => JSON.parse(readFileSync(resolve(DATA_DIR, file), 'utf8'));

export function parse() {
  const data = { modulos: [], comandos: [], procesos: [], videos: [] };

  // Módulos (secciones del portal). Los campos extra de presentación
  // (icono, layout, titulo_tarjetas) no viajan a Directus.
  for (const m of readJson('modulos.json')) {
    if (m.estado !== 'publicado') continue;
    data.modulos.push({
      slug: m.slug,
      titulo: clean(m.titulo),
      descripcion: m.descripcion ? clean(m.descripcion) : null,
      orden: m.orden,
      estado: m.estado,
      _section: m.sectionId,
    });
  }

  // Comandos por módulo
  for (const c of readJson('comandos.json')) {
    if (c.estado !== 'publicado') continue;
    data.comandos.push({
      etiqueta: clean(c.etiqueta),
      tecla: clean(c.tecla),
      tipo: c.tipo,
      icono: c.icono ? clean(c.icono) : null,
      orden: c.orden,
      estado: c.estado,
      _modulo: c.modulo,
    });
  }

  // Videos del portal (el archivo se lee de public/media/)
  for (const v of readJson('videos.json')) {
    if (v.estado !== 'publicado') continue;
    data.videos.push({
      titulo: clean(v.titulo),
      archivo: v.archivo,
      orden: v.orden,
      estado: v.estado,
      _modulo: v.modulo,
    });
  }

  // Procesos + pasos (bloques de los modales)
  for (const p of readJson('procesos.json')) {
    if (p.estado !== 'publicado') continue;

    const proceso = {
      slug: p.slug || slugify(p.titulo),
      titulo: clean(p.titulo),
      descripcion: clean(p.descripcion),
      duracion_min: p.duracion_min ?? null,
      icono: p.icono ? clean(p.icono) : null,
      orden: p.orden,
      estado: p.estado,
      _pasos: [],
    };

    let orden = 1;
    for (const bloque of p.modal?.bloques ?? []) {
      for (const item of bloque.items) {
        proceso._pasos.push({
          grupo: bloque.titulo ? clean(bloque.titulo) : null,
          orden: orden++,
          contenido: item.contenido.trim(),
        });
      }
    }

    data.procesos.push(proceso);
  }

  return data;
}

/* ---------- Carga en Directus ---------- */
export async function count(collection) {
  const r = await api(`/items/${collection}?limit=1&meta=total_count`);
  return r.meta?.total_count ?? r.data.length;
}

async function clearAll() {
  // Borrar primero los archivos de video (huérfanos si no)
  const vids = (await api('/items/videos?fields=id,archivo&limit=-1')).data;
  for (const v of vids) if (v.archivo) await api(`/files/${v.archivo}`, { method: 'DELETE' });

  for (const c of ['pasos', 'comandos', 'videos', 'procesos', 'modulos']) {
    const ids = (await api(`/items/${c}?fields=id&limit=-1`)).data.map((r) => r.id);
    for (const id of ids) await api(`/items/${c}/${id}`, { method: 'DELETE' });
    if (ids.length) console.log(`  borrados ${ids.length} de ${c}`);
  }
}

async function main() {
  console.log(`→ Directus: ${BASE}`);
  await login();

  const existing = await count('comandos');
  if (existing > 0) {
    if (!FORCE) {
      console.log(`⚠ Ya hay ${existing} comandos. Usa --force para re-migrar.`);
      return;
    }
    console.log('→ --force: borrando contenido existente…');
    await clearAll();
  }

  const data = parse();  console.log(
    `→ Parseado: ${data.modulos.length} módulos, ${data.comandos.length} comandos, ` +
      `${data.procesos.length} procesos (${data.procesos.reduce((n, p) => n + p._pasos.length, 0)} pasos), ` +
      `${data.videos.length} videos`,
  );

  // 1. Módulos
  const moduloIds = {};
  for (const m of data.modulos) {
    const { _section, ...body } = m;
    moduloIds[m.slug] = (await api('/items/modulos', { method: 'POST', body: JSON.stringify(body) })).data.id;
  }

  // 2. Comandos
  for (const c of data.comandos) {
    const { _modulo, ...body } = c;
    await api('/items/comandos', {
      method: 'POST',
      body: JSON.stringify({ ...body, modulo: moduloIds[_modulo] }),
    });
  }

  // 3. Procesos + pasos
  for (const p of data.procesos) {
    const { _pasos, ...body } = p;
    const { data: proc } = await api('/items/procesos', { method: 'POST', body: JSON.stringify(body) });
    for (const paso of _pasos) {
      await api('/items/pasos', {
        method: 'POST',
        body: JSON.stringify({ ...paso, proceso: proc.id }),
      });
    }
  }

  // 4. Videos (subida de archivo + registro)
  for (const v of data.videos) {
    const { _modulo, archivo, ...body } = v;
    const filePath = resolve(MEDIA_DIR, archivo);
    if (!existsSync(filePath)) throw new Error(`No existe el video: ${filePath}`);
    const form = new FormData();
    form.append('file', new Blob([await readFile(filePath)], { type: 'video/mp4' }), archivo);
    const uploaded = await api('/files', { method: 'POST', body: form });
    await api('/items/videos', {
      method: 'POST',
      body: JSON.stringify({ ...body, archivo: uploaded.data.id, modulo: moduloIds[_modulo] }),
    });
    console.log(`  video subido: ${archivo}`);
  }

  // Resumen final
  const resumen = {};
  for (const c of ['modulos', 'comandos', 'procesos', 'pasos', 'videos']) resumen[c] = await count(c);
  console.log('\n✅ Migración completada:', resumen);
}

// Solo ejecuta main si se invoca directamente (no al importar desde verify.mjs)
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    console.error('❌', err.message);
    process.exit(1);
  });
}
