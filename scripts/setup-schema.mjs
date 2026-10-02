#!/usr/bin/env node
/* ==========================================================
   Esquema Directus por API — declarativo e idempotente
   Uso: node setup-schema.mjs [--dry-run]

   Garantiza colecciones, campos y relaciones del portal. A diferencia de
   `directus snapshot apply`, NO borra nada: si algo falta lo crea, y si
   existe lo deja intacto. Se puede reejecutar cuantas veces se quiera.
   ========================================================== */

import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry-run');

/* ---------- Entorno / API (compartido con migrate.mjs) ---------- */
function loadEnv() {
  const env = {};
  const file = resolve(ROOT, '.env');
  if (!existsSync(file)) throw new Error('Falta .env en la raíz del proyecto');
  for (const line of readFileSync(file, 'utf8').split('\n')) {
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
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${options.method || 'GET'} ${path} → ${res.status}: ${JSON.stringify(json)}`);
  return json;
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
  const json = await res.json();
  if (!res.ok) throw new Error(`Login falló: ${JSON.stringify(json)}`);
  token = json.data.access_token;
}

/* ---------- Definición declarativa del esquema ---------- */

const ESTADO_CHOICES = [
  { text: 'Borrador', value: 'borrador' },
  { text: 'Publicado', value: 'publicado' },
  { text: 'Archivado', value: 'archivado' },
];

/* Campo de estado compartido por las colecciones publicables */
const estadoField = () => ({
  type: 'string',
  meta: { interface: 'input-dropdown', required: true, choices: ESTADO_CHOICES },
  schema: { default_value: 'publicado', max_length: 20, is_nullable: false },
});

const idField = () => ({
  type: 'integer',
  meta: { hidden: true, readonly: true, interface: 'input', special: ['auto-increment'] },
  schema: {
    is_primary_key: true,
    has_auto_increment: true,
    is_nullable: false,
    numeric_precision: 32,
    numeric_scale: 0,
  },
});

const ordenField = () => ({
  type: 'integer',
  meta: { interface: 'input', options: { step: 1 } },
  schema: { default_value: 0, numeric_precision: 32, numeric_scale: 0 },
});

const m2oField = (note) => ({
  type: 'integer',
  meta: { interface: 'select-dropdown-m2o', special: ['m2o'], required: false, ...(note ? { note } : {}) },
  schema: { numeric_precision: 32, numeric_scale: 0 },
});

const archivoField = () => ({
  type: 'string',
  meta: { interface: 'input', note: 'Nombre del MP4 en public/media (p. ej. Bunny.mp4)' },
  schema: { max_length: 255 },
});

const textoField = (note) => ({
  type: 'text',
  meta: { interface: 'input-multiline', ...(note ? { note } : {}) },
  schema: {},
});

const htmlField = (note, required = false) => ({
  type: 'text',
  meta: { interface: 'input-rich-text-html', ...(note ? { note } : {}), ...(required ? { required: true } : {}) },
  schema: required ? { is_nullable: false } : {},
});

const SCHEMA = {
  modulos: {
    meta: {
      icon: 'layers',
      note: 'Secciones del portal (Búsqueda, Suscriptor, Consultas, Procesos)',
      display_template: '{{titulo}}',
      sort_field: 'orden',
      archive_field: 'estado',
      archive_value: 'archivado',
      unarchive_value: 'publicado',
      draft_value: 'borrador',
      sort: 1,
    },
    fields: {
      id: idField(),
      slug: {
        type: 'string',
        meta: { interface: 'input', required: true, note: 'Identificador de URL (ej. busqueda, suscriptor)' },
        schema: { max_length: 64, is_nullable: false, is_unique: true },
      },
      titulo: {
        type: 'string',
        meta: { interface: 'input', required: true },
        schema: { max_length: 255, is_nullable: false },
      },
      descripcion: textoField(),
      icono: {
        type: 'string',
        meta: { interface: 'input', note: 'Nombre de icono Lucide (search, users, link, clipboard-list)' },
        schema: { max_length: 64 },
      },
      layout: {
        type: 'string',
        meta: {
          interface: 'input-dropdown',
          note: 'Cómo se compone la sección en la portada',
          choices: [
            { text: 'Video a la izquierda + tarjetas', value: 'video-izquierda' },
            { text: 'Video a la derecha + tarjetas', value: 'video-derecha' },
            { text: 'Solo tarjetas a ancho completo', value: 'tarjetas-ancho' },
            { text: 'Procesos', value: 'procesos' },
          ],
        },
        schema: { default_value: 'tarjetas-ancho', max_length: 32 },
      },
      titulo_tarjetas: {
        type: 'string',
        meta: { interface: 'input', note: 'Encabezado sobre la rejilla de comandos (vacío = sin título)' },
        schema: { max_length: 120 },
      },
      orden: ordenField(),
      estado: estadoField(),
    },
  },
  comandos: {
    meta: {
      icon: 'keyboard',
      note: 'Comandos y teclas de función que se muestran como tarjetas',
      display_template: '{{etiqueta}}',
      sort_field: 'orden',
      archive_field: 'estado',
      archive_value: 'archivado',
      unarchive_value: 'publicado',
      draft_value: 'borrador',
      sort: 2,
    },
    fields: {
      id: idField(),
      etiqueta: {
        type: 'string',
        meta: { interface: 'input', required: true, note: 'Texto de la tarjeta (ej. Búsqueda por número de cuenta)' },
        schema: { max_length: 255, is_nullable: false },
      },
      tecla: {
        type: 'string',
        meta: { interface: 'input', required: true, note: 'Tecla o combinación (ej. F21+F15)' },
        schema: { max_length: 64, is_nullable: false },
      },
      tipo: {
        type: 'string',
        meta: {
          interface: 'input-dropdown',
          required: true,
          choices: [
            { text: 'Básico', value: 'basico' },
            { text: 'Avanzado (destacado)', value: 'avanzado' },
          ],
        },
        schema: { default_value: 'basico', max_length: 16, is_nullable: false },
      },
      icono: {
        type: 'string',
        meta: { interface: 'input', note: 'Emoji o nombre de icono' },
        schema: { max_length: 64 },
      },
      modulo: m2oField(),
      orden: ordenField(),
      estado: estadoField(),
    },
  },
  categorias: {
    meta: {
      icon: 'folder',
      note: 'Agrupación de procesos (HOGAR, MÓVIL, Marcaciones Cerradas)',
      display_template: '{{nombre}}',
      sort_field: 'orden',
      archive_field: 'estado',
      archive_value: 'archivado',
      unarchive_value: 'publicado',
      draft_value: 'borrador',
      sort: 3,
    },
    fields: {
      id: idField(),
      slug: {
        type: 'string',
        meta: { interface: 'input', required: true, note: 'Identificador de URL (ej. hogar, movil, marcaciones)' },
        schema: { max_length: 64, is_nullable: false, is_unique: true },
      },
      nombre: {
        type: 'string',
        meta: { interface: 'input', required: true },
        schema: { max_length: 255, is_nullable: false },
      },
      descripcion: textoField(),
      icono: {
        type: 'string',
        meta: { interface: 'input', note: 'Emoji o nombre de icono' },
        schema: { max_length: 64 },
      },
      titulo_corto: {
        type: 'string',
        meta: { interface: 'input', note: 'Encabezado corto de la tarjeta en la portada (HOGAR, MÓVIL...)' },
        schema: { max_length: 40 },
      },
      texto_tarjeta: textoField(),
      tono: {
        type: 'string',
        meta: {
          interface: 'input-dropdown',
          note: 'Color de acento de la tarjeta en la portada',
          choices: [
            { text: 'Primario (azul)', value: 'primary' },
            { text: 'Acento (ámbar)', value: 'accent' },
            { text: 'Éxito (verde)', value: 'success' },
          ],
        },
        schema: { default_value: 'primary', max_length: 16 },
      },
      etiqueta_enlace: {
        type: 'string',
        meta: { interface: 'input', note: 'Texto del enlace de la tarjeta (vacío = "Ver procesos")' },
        schema: { max_length: 40 },
      },
      orden: ordenField(),
      estado: estadoField(),
    },
  },
  procesos: {
    meta: {
      icon: 'route',
      note: 'Procedimientos paso a paso (antes modales)',
      display_template: '{{titulo}}',
      sort_field: 'orden',
      archive_field: 'estado',
      archive_value: 'archivado',
      unarchive_value: 'publicado',
      draft_value: 'borrador',
      sort: 4,
    },
    fields: {
      id: idField(),
      slug: {
        type: 'string',
        meta: { interface: 'input', required: true, note: 'URL del proceso (ej. creacion-pqr)' },
        schema: { max_length: 64, is_nullable: false, is_unique: true },
      },
      titulo: {
        type: 'string',
        meta: { interface: 'input', required: true },
        schema: { max_length: 255, is_nullable: false },
      },
      descripcion: textoField(),
      duracion_min: {
        type: 'integer',
        meta: { interface: 'input', note: 'Duración estimada en minutos', options: { step: 1, min: 1 } },
        schema: { numeric_precision: 32, numeric_scale: 0 },
      },
      icono: { type: 'string', meta: { interface: 'input' }, schema: { max_length: 64 } },
      categoria: m2oField('Categoría a la que pertenece (HOGAR, MÓVIL, Marcaciones Cerradas)'),
      codigo: {
        type: 'string',
        meta: { interface: 'input', note: 'Código de marcación (ej. SAC NPP); solo en categoría Marcaciones' },
        schema: { max_length: 32 },
      },
      nota: htmlField('Nota o advertencia del proceso (puede contener <strong>, <code>)'),
      creado_por: {
        type: 'uuid',
        meta: {
          interface: 'select-dropdown-m2o',
          special: ['m2o'],
          readonly: true,
          note: 'Agente que propuso el proceso (cola de validación)',
        },
        schema: {
          is_nullable: true,
          foreign_key_table: 'directus_users',
          foreign_key_column: 'id',
          constraint_name: 'procesos_creado_por_foreign',
          on_delete: 'SET NULL',
        },
      },
      orden: ordenField(),
      estado: estadoField(),
    },
  },
  pasos: {
    meta: {
      icon: 'list-ordered',
      note: 'Pasos de un proceso, en orden',
      display_template: '{{grupo}} · paso {{orden}}',
      sort_field: 'orden',
      sort: 5,
    },
    fields: {
      id: idField(),
      proceso: { ...m2oField(), meta: { interface: 'select-dropdown-m2o', special: ['m2o'], required: true } },
      grupo: {
        type: 'string',
        meta: { interface: 'input', note: 'Subtítulo del bloque (ej. Parte 1: Gestión en RR/AS400)' },
        schema: { max_length: 255 },
      },
      orden: ordenField(),
      contenido: htmlField('Instrucción del paso (puede contener <strong>)', true),
    },
  },
  videos: {
    meta: {
      icon: 'video_library',
      note: 'Videos MP4 de los tutoriales',
      display_template: '{{titulo}}',
      sort_field: 'orden',
      archive_field: 'estado',
      archive_value: 'archivado',
      unarchive_value: 'publicado',
      draft_value: 'borrador',
      sort: 6,
    },
    fields: {
      id: idField(),
      titulo: {
        type: 'string',
        meta: { interface: 'input', required: true },
        schema: { max_length: 255, is_nullable: false },
      },
      archivo: archivoField(),
      poster: {
        type: 'string',
        meta: { interface: 'input', note: 'Imagen de portada (opcional)' },
        schema: { max_length: 511 },
      },
      modulo: m2oField(),
      orden: ordenField(),
      estado: estadoField(),
    },
  },
};

/* Relaciones (se crean al final, cuando ambas colecciones existen) */
const RELATIONS = [
  {
    collection: 'comandos',
    field: 'modulo',
    related_collection: 'modulos',
    on_delete: 'CASCADE',
    alias: 'comandos_modulo',
  },
  {
    collection: 'procesos',
    field: 'categoria',
    related_collection: 'categorias',
    on_delete: 'SET NULL',
    alias: 'procesos_categoria',
  },
  {
    collection: 'procesos',
    field: 'creado_por',
    related_collection: 'directus_users',
    on_delete: 'SET NULL',
    alias: 'procesos_creado_por',
  },
  {
    collection: 'pasos',
    field: 'proceso',
    related_collection: 'procesos',
    on_delete: 'CASCADE',
    alias: 'pasos_proceso',
  },
  {
    collection: 'videos',
    field: 'modulo',
    related_collection: 'modulos',
    on_delete: 'CASCADE',
    alias: 'videos_modulo',
  },
];

/* ---------- Reconciliación ---------- */

/* Directus mantiene una caché de esquema que puede ir un paso por detrás
   de la base tras un `snapshot apply` fallido: la colección se crea pero
   /collections aún no la lista. Tratamos "already exists" como OK. */
async function ensureCollection(name, existentes) {
  if (existentes.has(name)) return false;
  if (DRY) {
    console.log(`  [dry] crear colección ${name}`);
    return true;
  }
  try {
    await api('/collections', {
      // `meta` DEBE ir anidado: en el nivel raíz Directus lo ignora y la
      // colección queda sin fila en directus_collections (invisible en /admin).
      body: JSON.stringify({ collection: name, meta: SCHEMA[name].meta, schema: { name } }),
    });
    console.log(`  colección creada: ${name}`);
  } catch (err) {
    if (!/already exists/i.test(err.message)) throw err;
    console.log(`  colección ${name}: ya existía`);
  }
  existentes.add(name);
  return true;
}

/* Repara colecciones creadas con el bug de `meta` en nivel raíz (o cuya
   metadata se haya perdido): si falta la fila en directus_collections, la
   repone con PATCH /collections/:name — no toca la tabla ni los datos. */
async function ensureMeta(name) {
  if (DRY) return;
  const col = (await api(`/collections/${name}?fields=collection,meta`)).data;
  if (col.meta && col.meta.icon != null) return;
  await api(`/collections/${name}`, {
    method: 'PATCH',
    body: JSON.stringify({ meta: SCHEMA[name].meta }),
  });
  console.log(`  metadata repuesta: ${name}`);
}

async function ensureFields(name) {
  const actuales = (await api(`/fields/${name}`)).data.map((f) => f.field);
  for (const [campo, def] of Object.entries(SCHEMA[name].fields)) {
    if (actuales.includes(campo)) continue;
    if (DRY) {
      console.log(`  [dry] ${name}.${campo}`);
      continue;
    }
    try {
      await api(`/fields/${name}`, { method: 'POST', body: JSON.stringify({ field: campo, ...def }) });
      console.log(`  campo: ${name}.${campo}`);
    } catch (err) {
      if (!/already exists/i.test(err.message)) throw err;
    }
  }
}

async function ensureRelations() {
  const actuales = (await api('/relations')).data;
  for (const r of RELATIONS) {
    const yaExiste = actuales.some((x) => x.collection === r.collection && x.field === r.field);
    if (yaExiste) continue;
    if (DRY) {
      console.log(`  [dry] relación ${r.collection}.${r.field} → ${r.related_collection}`);
      continue;
    }
    await api('/relations', {
      method: 'POST',
      body: JSON.stringify({
        collection: r.collection,
        field: r.field,
        related_collection: r.related_collection,
        schema: { on_delete: r.on_delete, on_update: 'CASCADE' },
        meta: {
          many_collection: r.collection,
          many_field: r.field,
          one_collection: r.related_collection,
          one_field: null,
          one_allowed_collections: [null],
          one_deselect_action: 'nullify',
          sort_field: 'orden',
          alias: r.alias,
        },
      }),
    });
    console.log(`  relación: ${r.collection}.${r.field} → ${r.related_collection}`);
  }
}

async function main() {
  console.log(`→ Directus: ${BASE}${DRY ? ' (dry-run)' : ''}`);
  await login();

  console.log('\n[1/3] Colecciones y campos');
  const existentes = new Set((await api('/collections?limit=-1')).data.map((c) => c.collection));
  for (const name of Object.keys(SCHEMA)) {
    await ensureCollection(name, existentes);
    await ensureMeta(name);
    await ensureFields(name);
  }

  console.log('\n[2/3] Relaciones');
  await ensureRelations();

  console.log('\n[3/3] Verificación');
  if (!DRY) {
    const cols = new Set((await api('/collections?limit=-1')).data.map((c) => c.collection));
    for (const name of Object.keys(SCHEMA)) {
      const f = cols.has(name) ? (await api(`/fields/${name}`)).data.map((x) => x.field) : [];
      const faltan = Object.keys(SCHEMA[name].fields).filter((x) => !f.includes(x));
      console.log(
        `  ${!cols.has(name) || faltan.length ? '✗' : '✓'} ${name}: ${f.length} campos${faltan.length ? ' (faltan: ' + faltan.join(', ') + ')' : ''}`,
      );
    }
    const rel = (await api('/relations')).data.filter((x) => !x.collection.startsWith('directus'));
    const faltanRel = RELATIONS.filter((r) => !rel.some((x) => x.collection === r.collection && x.field === r.field));
    console.log(
      `  ${faltanRel.length ? '✗' : '✓'} relaciones: ${rel.length}${faltanRel.length ? ' (faltan: ' + faltanRel.map((r) => r.collection + '.' + r.field).join(', ') + ')' : ''}`,
    );
  }

  console.log(`\n✅ Esquema listo${DRY ? ' (dry-run, no se aplicó nada)' : ''}`);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
