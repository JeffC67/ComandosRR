#!/usr/bin/env node
/* ==========================================================
   Esquema de la Fase 3 — evaluaciones
   Crea: quiz_preguntas, quiz_opciones, quiz_intentos
   (El módulo de progreso se eliminó de la plataforma.)
   Da permisos a la cuenta de servicio (policy "Portal — solo lectura")
   y al Editor para gestionar el banco de preguntas.

   Los nombres y tipos de campo están tomados del código, no al revés:
   · `quiz_intentos` → api/quiz/intentos escribe {agente, proceso, puntaje,
                       respuestas}  (no "intentos" ni "quiz")
   · `quiz_preguntas`→ api/quiz/[slug] filtra por proceso + estado, lee
                       id, enunciado, tipo, orden
   · `quiz_opciones` → api/quiz/[slug] lee id, pregunta, texto, orden
   `agente` es uuid porque referencia directus_users.id; `proceso` es
   integer porque TODAS las tablas de contenido usan id entero
   (procesos.id es integer).

   Dos cosas que cuesta aprender de Directus 12, y que por eso están
   escritas aquí:

   1. `POST /collections` ignora el bloque `schema`: crea la tabla con
      un único `id integer` autogenerado y nada más. Hay que crear la
      colección primero y añadir cada campo con `POST /fields/:col`.
      (Peor: si la colección se creara sin tabla, `/fields/<col>`
      respondería 403 para siempre y el script no se puede recuperar.)

   2. Los permisos con reglas condicionales (`{ agente: { _eq:
      '$CURRENT_USER' } }`) son el recurso de pago
      `custom_permission_rules_enabled`. En la edición gratuita, POST
      /permissions las devuelve con RESOURCE_RESTRICTED. Por eso aquí
      todos los permisos son `{}` (sin filtro) y el aislamiento por
      agente lo hace el servidor, que ya filtra por `session.sub` en
      cada consulta. Es el mismo criterio que setup-access.mjs.

   Idempotente: se puede volver a ejecutar sin duplicar nada.
   Uso: npm run setup:phase3
   ========================================================== */

import { login, api, BASE } from './migrate.mjs';

const NOMBRES = ['quiz_preguntas', 'quiz_opciones', 'quiz_intentos'];

/* ---------- utilidades ---------- */

const yaEsta = (list, policy, collection, action) =>
  list.some((p) => p.policy === policy && p.collection === collection && p.action === action);

async function asegurarPermiso(body, actuales) {
  if (yaEsta(actuales, body.policy, body.collection, body.action)) return 'ya existe';
  await api('/permissions', { method: 'POST', body: JSON.stringify(body) });
  return 'creado';
}

const camposDe = async (coleccion) => (await api(`/fields/${coleccion}?fields=field,type&limit=-1`)).data;

const nombresDe = async (coleccion) => (await camposDe(coleccion)).map((f) => f.field);

/* Las relaciones van aparte de los campos: `POST /fields` acepta las
   claves `foreign_key_*` del schema y las ignora — crea la columna pero
   ni la constraint ni la fila en `directus_relations`, sin la cual los
   joins del app (`proceso.titulo`, filtrar por `pregunta`) fallan.

   El cuerpo usa los nombres antiguos (collection / field /
   related_collection) aunque la respuesta venga con many_* / one_*:
   es lo que valida POST /relations en Directus 12. Y trae
   `schema.on_delete` / `on_update`, que es donde se decide la FK real.

   OJO: `/relations/{id}` está roto en Directus 12 — trata el id como
   nombre de colección y responde 403. Una relación creada sin
   `on_delete` no se puede corregir: queda en NO ACTION para siempre.
   La única salida es borrar el campo (lo que se lleva la constraint) y
   volverlo a crear, y eso es lo que hace `asegurarRelacion`. Se niega
   a hacerlo si la columna tiene filas, para no perder datos. */
async function asegurarRelacion(coleccion, campo, destino, crearColumna) {
  const relacion = (await api('/relations?limit=-1')).data.find((r) => r.collection === coleccion && r.field === campo);

  if (relacion) {
    if (relacion.related_collection !== destino) {
      throw new Error(
        `${coleccion}.${campo} apunta a ${relacion.related_collection} en vez de a ${destino}. ` +
          `Corrígelo en /admin o borra la columna ${campo}.`,
      );
    }
    if (relacion.schema?.on_delete === 'CASCADE') return 'ya existe';

    const { data: filled } = await api(`/items/${coleccion}?limit=1&filter[${campo}][_nnull]=true`);
    if (filled.length > 0) {
      throw new Error(
        `${coleccion}.${campo} tiene on_delete=${relacion.schema?.on_delete} y además datos. ` +
          `No se puede rehacer automáticamente sin perderlos: migra los datos y repite.`,
      );
    }
    await api(`/fields/${coleccion}/${campo}`, { method: 'DELETE' });
    await crearColumna();
  }

  await api('/relations', {
    method: 'POST',
    body: JSON.stringify({
      collection: coleccion,
      field: campo,
      related_collection: destino,
      schema: { on_delete: 'CASCADE', on_update: 'CASCADE' },
      meta: { one_deselect_action: 'nullify', one_allowed_collections: [] },
    }),
  });
  return 'creada';
}

/* ---------- definiciones de las tablas ---------- */

/* Cada columna con su tipo SQL. Las FK van con `foreign_key_table` +
   `on_delete: CASCADE` para no dejar filas huérfanas si un editor
   borra una pregunta. */
const TABLAS = {
  quiz_preguntas: {
    meta: {
      icon: 'quiz',
      note: 'Preguntas de evaluación por proceso',
      display_template: '{{enunciado}}',
      sort_field: 'orden',
      color: '#0ea5e9',
      sort: 2,
      archive_field: 'estado',
      archive_value: 'archivado',
      unarchive_value: 'publicado',
    },
    columnas: [
      {
        field: 'proceso',
        type: 'integer',
        schema: {
          data_type: 'integer',
          is_nullable: false,
          foreign_key_table: 'procesos',
          foreign_key_column: 'id',
          constraint_name: 'quiz_preguntas_proceso_foreign',
          on_delete: 'CASCADE',
        },
        meta: { special: ['m2o'], interface: 'select-dropdown-mapped' },
      },
      { field: 'enunciado', type: 'text', schema: { data_type: 'text' }, meta: { interface: 'input-multiline' } },
      {
        field: 'tipo',
        type: 'string',
        schema: { data_type: 'character varying', default_value: 'unica' },
        meta: {
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Única', value: 'unica' },
              { text: 'Múltiple', value: 'multiple' },
            ],
          },
        },
      },
      {
        field: 'orden',
        type: 'integer',
        schema: { data_type: 'integer', default_value: 1 },
        meta: { interface: 'input' },
      },
      {
        field: 'estado',
        type: 'string',
        schema: { data_type: 'character varying', default_value: 'publicado' },
        meta: {
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Publicado', value: 'publicado' },
              { text: 'Borrador', value: 'borrador' },
            ],
          },
        },
      },
    ],
  },

  quiz_opciones: {
    meta: {
      icon: 'radio_button_checked',
      note: 'Opciones de respuesta de quiz_preguntas',
      display_template: '{{texto}}',
      sort_field: 'orden',
      color: '#0ea5e9',
      sort: 3,
      archive_field: null,
    },
    columnas: [
      {
        field: 'pregunta',
        type: 'integer',
        schema: {
          data_type: 'integer',
          is_nullable: false,
          foreign_key_table: 'quiz_preguntas',
          foreign_key_column: 'id',
          constraint_name: 'quiz_opciones_pregunta_foreign',
          on_delete: 'CASCADE',
        },
        meta: { special: ['m2o'], interface: 'select-dropdown-mapped' },
      },
      { field: 'texto', type: 'text', schema: { data_type: 'text' }, meta: { interface: 'input' } },
      {
        field: 'es_correcta',
        type: 'boolean',
        schema: { data_type: 'boolean', default_value: false },
        meta: { interface: 'boolean' },
      },
      {
        field: 'orden',
        type: 'integer',
        schema: { data_type: 'integer', default_value: 1 },
        meta: { interface: 'input' },
      },
    ],
  },

  quiz_intentos: {
    meta: {
      icon: 'assignment_turned_in',
      note: 'Intentos de evaluación por agente y proceso',
      display_template: '{{puntaje}}',
      sort_field: 'fecha',
      color: '#f59e0b',
      sort: 4,
      archive_field: null,
    },
    columnas: [
      {
        field: 'agente',
        type: 'uuid',
        schema: {
          data_type: 'uuid',
          is_nullable: false,
          foreign_key_table: 'directus_users',
          foreign_key_column: 'id',
          constraint_name: 'quiz_intentos_agente_foreign',
          on_delete: 'CASCADE',
        },
        meta: { special: ['m2o'], interface: 'select-dropdown-mapped' },
      },
      {
        field: 'proceso',
        type: 'integer',
        schema: {
          data_type: 'integer',
          is_nullable: false,
          foreign_key_table: 'procesos',
          foreign_key_column: 'id',
          constraint_name: 'quiz_intentos_proceso_foreign',
          on_delete: 'CASCADE',
        },
        meta: { special: ['m2o'], interface: 'select-dropdown-mapped' },
      },
      { field: 'puntaje', type: 'integer', schema: { data_type: 'integer' }, meta: { interface: 'input' } },
      {
        field: 'respuestas',
        type: 'json',
        schema: { data_type: 'json', is_nullable: true },
        meta: { interface: 'input-code', options: { language: 'json' } },
      },
      {
        field: 'fecha',
        type: 'timestamp',
        schema: { data_type: 'timestamp with time zone', default_value: 'now()' },
        meta: { interface: 'datetime' },
      },
    ],
  },
};

/* ---------- programa ---------- */

async function main() {
  console.log(`→ Directus: ${BASE}`);
  await login();

  const existentes = (await api('/collections?limit=-1&fields=collection')).data.map((c) => c.collection);

  /* ==========================================================
     1. Colecciones y columnas
     ========================================================== */
  for (const [nombre, def] of Object.entries(TABLAS)) {
    if (existentes.includes(nombre)) {
      console.log(`\n→ ${nombre}: ya existe`);
    } else {
      await api('/collections', {
        method: 'POST',
        body: JSON.stringify({ collection: nombre, meta: def.meta }),
      });
      console.log(`\n→ ${nombre} creada`);
    }

    const crearColumna = async (col) => {
      try {
        await api(`/fields/${nombre}`, {
          method: 'POST',
          body: JSON.stringify({
            field: col.field,
            type: col.type,
            meta: col.meta,
            schema: col.schema,
          }),
        });
      } catch (e) {
        throw new Error(`No se pudo crear ${nombre}.${col.field}: ${e.message}`);
      }
    };

    /* Una columna con el tipo equivocado no se puede "arreglar" en
       sitio — hay que borrarla y recrearla, y eso solo es aceptable si
       está vacía. */
    const camposActuales = await camposDe(nombre);
    for (const col of def.columnas) {
      const actual = camposActuales.find((f) => f.field === col.field);
      if (!actual) {
        await crearColumna(col);
        console.log(`   ✅ ${col.field} (${col.type})`);
        continue;
      }
      if (actual.type === col.type) continue;

      const { data: filled } = await api(`/items/${nombre}?limit=1&filter[${col.field}][_nnull]=true`);
      if (filled.length > 0) {
        throw new Error(
          `${nombre}.${col.field} es de tipo ${actual.type} y el esquema pide ${col.type}, ` +
            `además tiene datos. Corrígelo a mano en /admin.`,
        );
      }
      await api(`/fields/${nombre}/${col.field}`, { method: 'DELETE' });
      await crearColumna(col);
      console.log(`   ↻ ${col.field}: ${actual.type} → ${col.type} (rehecha, estaba vacía)`);
    }

    /* Toda columna que declara `foreign_key_table` es una m2o, y la
       relación se crea aquí — no en el paso del campo, que la ignora. */
    for (const col of def.columnas) {
      if (!col.schema?.foreign_key_table) continue;
      const r = await asegurarRelacion(nombre, col.field, col.schema.foreign_key_table, () => crearColumna(col));
      if (r === 'creada') {
        console.log(`   ✅ relación ${nombre}.${col.field} → ${col.schema.foreign_key_table} (CASCADE)`);
      }
    }
  }

  /* Comprobación: la tabla tiene que existir de verdad, no solo la
     entrada en /collections, y la relación tiene que estar registrada
     en `directus_relations` o los joins del app no funcionan. */
  console.log('\n→ comprobación');
  const relaciones = (await api('/relations?limit=-1')).data;
  for (const n of NOMBRES) {
    const f = await nombresDe(n);
    const esperadas = TABLAS[n].columnas.map((c) => c.field);
    const faltan = esperadas.filter((c) => !f.includes(c));
    if (faltan.length) throw new Error(`${n} sin columnas: ${faltan.join(', ')}`);

    const detalle = TABLAS[n].columnas
      .filter((c) => c.schema?.foreign_key_table)
      .map((c) => {
        const r = relaciones.find((x) => x.collection === n && x.field === c.field);
        if (!r) throw new Error(`Falta la relación ${n}.${c.field} → ${c.schema.foreign_key_table}`);
        const od = r.schema?.on_delete;
        if (od !== 'CASCADE') {
          throw new Error(
            `${n}.${c.field} tiene on_delete=${od} en vez de CASCADE. No se puede corregir por API ` +
              `(/relations/{id} está roto en Directus 12): borra la colección ${n} en /admin y repite.`,
          );
        }
        return `${c.field}→${c.schema.foreign_key_table}`;
      });

    console.log(`   ✅ ${n} (${f.length} campos): ${f.join(', ')}`);
    if (detalle.length) console.log(`      relaciones: ${detalle.join(', ')}`);
  }

  /* ==========================================================
     2. Permisos (todos sin filtro: las reglas condicionales son de pago)
     ========================================================== */

  /* --- 2a. Cuenta de servicio (policy "Portal — solo lectura") ---
     Es la que usa Next.js: escribe los intentos de quiz del agente y
     lee las preguntas para corregirlas. El contenido de las fases 1
     y 2 sigue en solo lectura. El aislamiento por agente lo hace el
     servidor, que filtra por session.sub en cada consulta. */
  console.log('\n→ permisos de la cuenta de servicio (policy Portal)');
  const policies = (await api('/policies?fields=id,name&limit=-1')).data;
  const servicePolicy = policies.find((p) => p.name === 'Portal — solo lectura');
  if (!servicePolicy) {
    throw new Error('No existe la policy "Portal — solo lectura". Ejecuta primero: npm run setup:access');
  }

  const permisosService = (await api(`/permissions?limit=-1&filter[policy][_eq]=${servicePolicy.id}`)).data;

  for (const action of ['create', 'read']) {
    const r = await asegurarPermiso(
      { policy: servicePolicy.id, collection: 'quiz_intentos', action, permissions: {}, fields: ['*'] },
      permisosService,
    );
    if (r !== 'ya existe') console.log(`   portal ${action} quiz_intentos: ${r}`);
  }
  for (const c of ['quiz_preguntas', 'quiz_opciones']) {
    const r = await asegurarPermiso(
      { policy: servicePolicy.id, collection: c, action: 'read', permissions: {}, fields: ['*'] },
      permisosService,
    );
    if (r !== 'ya existe') console.log(`   portal read ${c}: ${r}`);
  }

  /* --- 2b. El Editor gestiona el banco de preguntas --- */
  console.log('\n→ permisos del Editor sobre las preguntas');
  const editorPolicy = policies.find((p) => p.name === 'Editor de contenido');
  if (!editorPolicy) {
    console.log('   ⚠ no existe la policy "Editor de contenido" — ejecuta npm run setup:access');
  } else {
    const permisosEditor = (await api(`/permissions?limit=-1&filter[policy][_eq]=${editorPolicy.id}`)).data;
    for (const c of NOMBRES) {
      for (const action of ['create', 'read', 'update', 'delete']) {
        const r = await asegurarPermiso(
          { policy: editorPolicy.id, collection: c, action, permissions: {}, fields: ['*'] },
          permisosEditor,
        );
        if (r !== 'ya existe') console.log(`   editor ${action} ${c}: ${r}`);
      }
    }
  }

  console.log('\n✅ Fase 3 lista');
  console.log('   · quiz_intentos: los escribe la cuenta de servicio');
  console.log('   · quiz_preguntas / quiz_opciones: las gestiona el Editor en /admin');
  console.log('   · para meter preguntas de ejemplo: npm run seed:quiz');
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
