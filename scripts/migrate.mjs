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
  const data = { modulos: [], comandos: [], categorias: [], procesos: [], videos: [] };

  // Módulos (secciones del portal). Todo lo que guía la presentación
  // (icono, layout, titulo_tarjetas) también vive en Directus, para que
  // el panel /admin pueda reordenar y renombrar secciones sin tocar código.
  for (const m of readJson('modulos.json')) {
    if (m.estado !== 'publicado') continue;
    data.modulos.push({
      slug: m.slug,
      titulo: clean(m.titulo),
      descripcion: m.descripcion ? clean(m.descripcion) : null,
      icono: m.icono || null,
      layout: m.layout || null,
      titulo_tarjetas: m.titulo_tarjetas ? clean(m.titulo_tarjetas) : null,
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

  // Categorías de procesos (HOGAR / MÓVIL / Marcaciones Cerradas)
  for (const c of readJson('categorias.json')) {
    if (c.estado !== 'publicado') continue;
    data.categorias.push({
      slug: c.slug,
      nombre: clean(c.nombre),
      descripcion: c.descripcion ? clean(c.descripcion) : null,
      icono: c.icono ? clean(c.icono) : null,
      titulo_corto: c.titulo_corto ? clean(c.titulo_corto) : null,
      texto_tarjeta: c.texto_tarjeta ? clean(c.texto_tarjeta) : null,
      tono: c.tono || 'primary',
      etiqueta_enlace: c.etiqueta_enlace ? clean(c.etiqueta_enlace) : null,
      orden: c.orden,
      estado: c.estado,
    });
  }

  // Procesos + pasos
  for (const p of readJson('procesos.json')) {
    if (p.estado !== 'publicado') continue;

    const proceso = {
      slug: p.slug || slugify(p.titulo),
      titulo: clean(p.titulo),
      descripcion: clean(p.descripcion),
      duracion_min: p.duracion_min ?? null,
      icono: p.icono ? clean(p.icono) : null,
      codigo: p.codigo ? clean(p.codigo) : null,
      nota: p.nota ? String(p.nota).replace(/\s+/g, ' ').trim() : null,
      orden: p.orden,
      estado: p.estado,
      _categoria: p.categoria,
      _pasos: [],
    };

    let orden = 1;
    for (const paso of p.pasos ?? []) {
      proceso._pasos.push({
        grupo: paso.grupo ? clean(paso.grupo) : null,
        orden: paso.orden ?? orden,
        contenido: String(paso.contenido).trim(),
      });
      orden++;
    }

    data.procesos.push(proceso);
  }

  return data;
}

/* ---------- Carga en Directus ---------- */
/* Recién migrados, el caché de Directus puede tardar un instante en
   reflejar las relaciones. Reintentamos antes de reportar 0. */
export async function count(collection) {
  let last;
  for (let intento = 0; intento < 5; intento++) {
    const r = await api(`/items/${collection}?limit=1&meta=total_count`);
    last = r.meta?.total_count ?? r.data.length;
    if (last > 0) return last;
    await new Promise((res) => setTimeout(res, 600));
  }
  return last;
}

const COLECCIONES = ['pasos', 'comandos', 'videos', 'procesos', 'categorias', 'modulos'];

/* Borra una colección hasta que quede realmente vacía.

   Dos trampas de Directus que hacen que un `DELETE` en bucle "vacío" la
   tabla sin vaciarla:

   1. Las colecciones pueden declarar `archive_field: 'estado'`. En ese
      caso un DELETE sin más solo pone la fila en `archivado`: desaparece
      del listado pero sigue ocupando el `slug` (índice único) y la
      siguiente migración falla con RECORD_NOT_UNIQUE. Por eso
      `?permanent=true`.
   2. La caché de datos de Directus devuelve ids obsoletos justo después
      de escribir. Si nos fiamos del listado para contar, borramos filas
      que ya no existen y damos por buena una tabla que sigue llena. Por
      eso se relee hasta ver 0 y se avisa si no se logra. */
async function vaciar(c) {
  let total = 0;

  for (let pasada = 0; pasada < 12; pasada++) {
    const { data, meta } = await api(`/items/${c}?fields=id&limit=-1&meta=total_count`);
    const restantes = meta?.total_count ?? data.length;
    if (restantes === 0) break;

    for (const r of data) await api(`/items/${c}/${r.id}?permanent=true`, { method: 'DELETE' });
    total += data.length;

    /* El caché de datos de Directus va por detrás de la tabla: sin una
       pausa el listado devuelve lo de antes del borrado, el bucle no
       avanzaría y la migración abortaría con filas que ya no existen. */
    await new Promise((res) => setTimeout(res, 800));
  }

  const { meta } = await api(`/items/${c}?limit=1&meta=total_count`);
  const quedan = meta?.total_count ?? 0;
  if (quedan > 0) {
    throw new Error(
      `No se pudo vaciar "${c}": quedan ${quedan} filas. ` +
        `Revisa que la cuenta de admin tenga permiso de escritura y que no haya ` +
        `procesos publicados que la bloqueen.`,
    );
  }

  if (total) console.log(`  borrados ${total} de ${c}`);
}

/* Vacía el contenido del portal. Borra TODOS los archivos de
   directus_files, no solo los referenciados por `videos`: si una fila
   apunta a un archivo que ya no existe, el DELETE falla y el huérfano
   sobrevive, y en la siguiente migración los items quedan apuntando a
   archivos inexistentes (los /assets devuelven 403). */
async function clearAll() {
  for (const c of COLECCIONES) await vaciar(c);

  const files = (await api('/files?fields=id&limit=-1')).data;
  for (const f of files) await api(`/files/${f.id}`, { method: 'DELETE' });
  if (files.length) console.log(`  borrados ${files.length} archivos huérfanos`);
}

async function main() {
  console.log(`→ Directus: ${BASE}`);
  await login();

  /* Se mira TODAS las colecciones, no solo `comandos`: una migración
     interrumpida puede dejar una vacía y las demás llenas, y si el
     guard solo mirara una, se saltaría el borrado y la siguiente
     vuelta fallaría con RECORD_NOT_UNIQUE al reinsertar los slugs. */
  const ocupadas = [];
  for (const c of COLECCIONES) {
    const n = await count(c);
    if (n > 0) ocupadas.push(`${c}: ${n}`);
  }

  if (ocupadas.length > 0) {
    const detalle = ocupadas.join(', ');
    if (!FORCE) {
      console.log(`⚠ Ya hay contenido en Directus (${detalle}). Usa --force para re-migrar.`);
      return;
    }
    console.log(`→ --force: borrando contenido existente… (${detalle})`);
    await clearAll();
  }

  const data = parse();  console.log(
    `→ Parseado: ${data.modulos.length} módulos, ${data.comandos.length} comandos, ` +
      `${data.categorias.length} categorías, ` +
      `${data.procesos.length} procesos (${data.procesos.reduce((n, p) => n + p._pasos.length, 0)} pasos), ` +
      `${data.videos.length} videos`,
  );

  // 1. Módulos
  const moduloIds = {};
  for (const m of data.modulos) {
    const { _section, ...body } = m;
    moduloIds[m.slug] = (await api('/items/modulos', { method: 'POST', body: JSON.stringify(body) })).data.id;
  }

  // 2. Categorías de procesos
  const categoriaIds = {};
  for (const c of data.categorias) {
    categoriaIds[c.slug] = (await api('/items/categorias', { method: 'POST', body: JSON.stringify(c) })).data.id;
  }

  // 3. Comandos
  for (const c of data.comandos) {
    const { _modulo, ...body } = c;
    await api('/items/comandos', {
      method: 'POST',
      body: JSON.stringify({ ...body, modulo: moduloIds[_modulo] }),
    });
  }

  // 4. Procesos + pasos
  for (const p of data.procesos) {
    const { _pasos, _categoria, ...body } = p;
    const { data: proc } = await api('/items/procesos', {
      method: 'POST',
      body: JSON.stringify({ ...body, categoria: categoriaIds[_categoria] ?? null }),
    });
    for (const paso of _pasos) {
      await api('/items/pasos', {
        method: 'POST',
        body: JSON.stringify({ ...paso, proceso: proc.id }),
      });
    }
  }

  // 5. Videos (subida de archivo + registro)
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
  for (const c of ['modulos', 'comandos', 'categorias', 'procesos', 'pasos', 'videos']) resumen[c] = await count(c);
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
