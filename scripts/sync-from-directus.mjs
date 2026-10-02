#!/usr/bin/env node
/* ==========================================================
   Sincronización del contenido: Directus → src/data/*.json   (Fase 3)

   Directus es la FUENTE DE VERDAD. Este script exporta lo que hay en la
   instancia y regenera los JSON que consumen `migrate.mjs` (carga inicial)
   y `verify.mjs` (comparación de ambos lados).

   Uso:
     node sync-from-directus.mjs            # escribe src/data/*.json
     node sync-from-directus.mjs --check    # no escribe; sale con 1 si algo
                                            # cambiaría (útil en CI / verify)

   Campos que solo existen en los JSON (no están en Directus):
     modulos.sectionId / layout / titulo_tarjetas
     procesos.pasos_visibles / tipo / ariaLabel
     videos.ariaLabel
   No se pueden leer de la instancia, así que se conservan del JSON actual
   y se listan al terminar. `hero.json` no tiene colección: no se toca.

   Autenticación (en este orden):
     1. DIRECTUS_TOKEN (token estático, si está en el entorno)
     2. DIRECTUS_SERVICE_EMAIL / DIRECTUS_SERVICE_PASSWORD de .env.local
     3. DIRECTUS_ADMIN_EMAIL / DIRECTUS_ADMIN_PASSWORD de .env
   ========================================================== */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = resolve(ROOT, 'src/data');
const CHECK = process.argv.includes('--check') || process.argv.includes('--dry-run');

/* ---------- Entorno ---------- */
function loadEnv(file) {
  const path = resolve(ROOT, file);
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !line.trim().startsWith('#')) env[m[1]] = m[2];
  }
  return env;
}

const dotEnv = loadEnv('.env');
const localEnv = loadEnv('.env.local');
const BASE =
  process.env.DIRECTUS_URL ||
  localEnv.DIRECTUS_URL ||
  `http://127.0.0.1:${process.env.DIRECTUS_PORT || dotEnv.DIRECTUS_PORT || 8056}`;

/* ---------- API ---------- */
let token = null;

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`${options.method || 'GET'} ${path} → ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function login() {
  const intentos = [];
  if (process.env.DIRECTUS_TOKEN) intentos.push(['token estático', null, process.env.DIRECTUS_TOKEN]);
  if (localEnv.DIRECTUS_SERVICE_EMAIL)
    intentos.push(['cuenta de servicio', localEnv.DIRECTUS_SERVICE_EMAIL, localEnv.DIRECTUS_SERVICE_PASSWORD]);
  if (dotEnv.DIRECTUS_ADMIN_EMAIL)
    intentos.push(['admin', dotEnv.DIRECTUS_ADMIN_EMAIL, dotEnv.DIRECTUS_ADMIN_PASSWORD]);

  let ultimo = 'no hay credenciales disponibles';
  for (const [nombre, email, credencial] of intentos) {
    try {
      if (email === null) {
        token = credencial;
        await request('/users/me?fields=id'); // valida el token
      } else {
        const r = await request('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password: credencial }),
        });
        token = r.data.access_token;
      }
      console.log(`→ ${BASE} · autenticado como ${nombre}`);
      return;
    } catch (err) {
      ultimo = `${nombre}: ${err.message.slice(0, 160)}`;
    }
  }
  throw new Error(`No se pudo autenticar contra Directus — ${ultimo}`);
}

/* ---------- Lectura ---------- */
async function items(coleccion, campos) {
  const r = await request(`/items/${coleccion}?fields=${encodeURIComponent(campos)}&limit=-1`);
  return r.data;
}

/* Los ficheros se referencian por id; los JSON guardan el nombre. */
async function fileMap() {
  const r = await request('/files?fields=id,filename_download&limit=-1');
  return Object.fromEntries(r.data.map((f) => [f.id, f.filename_download]));
}

const clean = (s) => (s === null || s === undefined ? null : String(s).replace(/\s+/g, ' ').trim());

/* Conserva el orden de claves del JSON actual y sus campos extra (los que
   no existen en Directus); si es un registro nuevo, usa el orden construido. */
const extras = new Set();
const vaciados = new Set();

function merge(prev, built, etiqueta) {
  if (!prev) return built;
  const out = {};
  for (const k of Object.keys(prev)) {
    if (k in built) {
      out[k] = built[k];
      const tenia = prev[k] !== null && prev[k] !== undefined && prev[k] !== '';
      const ahoraVacio = built[k] === null || built[k] === undefined || built[k] === '';
      if (tenia && ahoraVacio) vaciados.add(`${etiqueta}.${k}`);
    } else {
      out[k] = prev[k];
      extras.add(`${etiqueta}.${k}`);
    }
  }
  for (const k of Object.keys(built)) if (!(k in out)) out[k] = built[k];
  return out;
}

const readJson = (file) => {
  const path = resolve(DATA_DIR, file);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
};

const porOrden = (a, b) =>
  (a.orden ?? 0) - (b.orden ?? 0) || String(a.slug || a.titulo || '').localeCompare(String(b.slug || b.titulo || ''));

/* ---------- Main ---------- */
async function main() {
  await login();

  const prev = {
    modulos: readJson('modulos.json'),
    comandos: readJson('comandos.json'),
    categorias: readJson('categorias.json'),
    videos: readJson('videos.json'),
    procesos: readJson('procesos.json'),
  };

  const [modulosRaw, categoriasRaw, comandosRaw, videosRaw, procesosRaw, pasosRaw, archivos] = await Promise.all([
    items('modulos', 'slug,titulo,descripcion,icono,orden,estado,layout,titulo_tarjetas'),
    items('categorias', 'slug,nombre,descripcion,icono,orden,estado'),
    items('comandos', 'etiqueta,tecla,tipo,icono,modulo.slug,orden,estado'),
    items('videos', 'titulo,archivo,poster,modulo.slug,orden,estado'),
    items('procesos', 'slug,titulo,descripcion,duracion_min,icono,categoria.slug,codigo,nota,orden,estado'),
    items('pasos', 'proceso.slug,grupo,orden,contenido'),
    fileMap(),
  ]);

  const prevDe = (lista, registro, campo) =>
    Array.isArray(lista) ? lista.find((r) => r[campo] === registro[campo]) : null;

  const modulos = modulosRaw
    .map((m) =>
      merge(
        prevDe(prev.modulos, m, 'slug'),
        {
          slug: m.slug,
          titulo: clean(m.titulo),
          descripcion: m.descripcion ? clean(m.descripcion) : null,
          icono: m.icono || null,
          orden: m.orden,
          estado: m.estado,
          layout: m.layout || null,
          titulo_tarjetas: m.titulo_tarjetas || null,
        },
        'modulos',
      ),
    )
    .sort(porOrden);

  const ordenModulo = Object.fromEntries(modulos.map((m, i) => [m.slug, i]));

  const categorias = categoriasRaw
    .map((c) =>
      merge(
        prevDe(prev.categorias, c, 'slug'),
        {
          slug: c.slug,
          nombre: clean(c.nombre),
          descripcion: c.descripcion ? clean(c.descripcion) : null,
          icono: c.icono || null,
          orden: c.orden,
          estado: c.estado,
        },
        'categorias',
      ),
    )
    .sort(porOrden);

  const comandos = comandosRaw
    .map((c) =>
      merge(
        prevDe(prev.comandos, c, 'etiqueta'),
        {
          etiqueta: clean(c.etiqueta),
          tecla: clean(c.tecla),
          tipo: c.tipo,
          icono: c.icono ? clean(c.icono) : null,
          modulo: c.modulo?.slug ?? null,
          orden: c.orden,
          estado: c.estado,
        },
        'comandos',
      ),
    )
    .sort((a, b) => (ordenModulo[a.modulo] ?? 99) - (ordenModulo[b.modulo] ?? 99) || a.orden - b.orden);

  const videos = videosRaw
    .map((v) =>
      merge(
        prevDe(prev.videos, v, 'titulo'),
        {
          titulo: clean(v.titulo),
          archivo: archivos[v.archivo] ?? null,
          poster: archivos[v.poster] ?? null,
          modulo: v.modulo?.slug ?? null,
          orden: v.orden,
          estado: v.estado,
        },
        'videos',
      ),
    )
    .sort((a, b) => (ordenModulo[a.modulo] ?? 99) - (ordenModulo[b.modulo] ?? 99) || a.orden - b.orden);

  // Pasos agrupados por proceso, en su orden de ejecución
  const pasosPorProceso = new Map();
  for (const p of pasosRaw) {
    const slug = p.proceso?.slug;
    if (!slug) continue;
    if (!pasosPorProceso.has(slug)) pasosPorProceso.set(slug, []);
    pasosPorProceso
      .get(slug)
      .push({ orden: p.orden, grupo: p.grupo ? clean(p.grupo) : null, contenido: String(p.contenido ?? '').trim() });
  }
  for (const lista of pasosPorProceso.values()) lista.sort((a, b) => a.orden - b.orden);

  const procesos = procesosRaw
    .map((p) => {
      const pasos = pasosPorProceso.get(p.slug) ?? [];
      return merge(
        prevDe(prev.procesos, p, 'slug'),
        {
          slug: p.slug,
          titulo: clean(p.titulo),
          descripcion: clean(p.descripcion),
          duracion_min: p.duracion_min ?? null,
          icono: p.icono || null,
          categoria: p.categoria?.slug ?? null,
          codigo: p.codigo ? clean(p.codigo) : null,
          orden: p.orden,
          estado: p.estado,
          nota: p.nota ? clean(p.nota) : null,
          pasos,
        },
        'procesos',
      );
    })
    .sort(porOrden);

  const salida = { modulos, comandos, categorias, videos, procesos };

  /* ---------- Escritura / comparación ---------- */
  let cambios = 0;
  for (const [nombre, datos] of Object.entries(salida)) {
    const file = `${nombre}.json`;
    const contenido = `${JSON.stringify(datos, null, 2)}\n`;
    const actual = existsSync(resolve(DATA_DIR, file)) ? readFileSync(resolve(DATA_DIR, file), 'utf8') : null;
    const distinto = actual !== contenido;
    if (distinto) cambios++;

    const antes = prev[nombre]?.length ?? 0;
    const despues = datos.length;
    const marca = distinto ? '✎' : '=';
    const cuenta = antes === despues ? `${despues}` : `${antes} → ${despues}`;
    console.log(`  ${marca} ${file.padEnd(16)} ${cuenta} registros`);

    if (!CHECK && distinto) writeFileSync(resolve(DATA_DIR, file), contenido);
  }

  const totalPasos = procesos.reduce((n, p) => n + p.pasos.length, 0);
  console.log(
    `\n  pasos: ${totalPasos} · módulos: ${modulos.length} · comandos: ${comandos.length} · categorías: ${categorias.length} · videos: ${videos.length} · procesos: ${procesos.length}`,
  );
  if (extras.size) console.log(`  ⚠ Campos conservados del JSON (no existen en Directus): ${[...extras].join(', ')}`);
  if (vaciados.size)
    console.log(
      `  ⚠ Directus tiene vacíos campos que el JSON traía con valor: ${[...vaciados].join(', ')} ` +
        `(se exporta tal cual; el portal no los usa)`,
    );
  console.log('  ℹ hero.json no tiene colección en Directus: no se toca.');

  if (CHECK) {
    if (cambios) {
      console.log(`\n❌ --check: ${cambios} fichero(s) desincronizado(s). Ejecuta: node sync-from-directus.mjs`);
      process.exit(1);
    }
    console.log('\n✅ --check: src/data/*.json coincide con Directus');
  } else {
    console.log(
      cambios ? `\n✅ ${cambios} fichero(s) regenerado(s) desde Directus` : '\n✅ src/data/*.json ya estaba al día',
    );
  }
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
