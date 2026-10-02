#!/usr/bin/env node
/* ==========================================================
   Workflow de procesos guiados — roles agente / editor / admin
   · Sin rol visitante: vacía la policy pública (no hay acceso
     anónimo ni a contenido ni a assets).
   · Solo 3 roles de usuario: agente, Editor (=editor), Administrator
     (=admin). El rol Portal es cuenta de servicio interna, no login.
   · Añade procesos.creado_por (uuid → directus_users, SET NULL)
     para saber qué agente propuso cada borrador.
   · Da a la cuenta de servicio (policy Portal) create/update/delete
     en procesos y pasos: el aislamiento por rol lo hace Next.js
     (las reglas condicionales son de pago en Directus 12).
   · El Editor ya tiene CRUD total (ver setup-access.mjs).
   Uso: node setup-workflow.mjs
   Idempotente.
   ========================================================== */

import { login, api, BASE } from './migrate.mjs';

const yaEsta = (list, policy, collection, action) =>
  list.some((p) => p.policy === policy && p.collection === collection && p.action === action);

async function asegurarPermiso(body, actuales) {
  if (yaEsta(actuales, body.policy, body.collection, body.action)) return 'ya existe';
  await api('/permissions', { method: 'POST', body: JSON.stringify(body) });
  return 'creado';
}

async function main() {
  console.log(`→ Directus: ${BASE}`);
  await login();

  /* ---------- 1. Campo procesos.creado_por ---------- */
  console.log('\n[1/4] Campo procesos.creado_por');
  const campos = (await api('/fields/procesos?fields=field,type&limit=-1')).data.map((f) => f.field);
  if (!campos.includes('creado_por')) {
    await api('/fields/procesos', {
      method: 'POST',
      body: JSON.stringify({
        field: 'creado_por',
        type: 'uuid',
        meta: {
          interface: 'select-dropdown-m2o',
          special: ['m2o'],
          note: 'Agente que propuso el proceso (para la cola de validación)',
          readonly: true,
        },
        schema: {
          data_type: 'uuid',
          is_nullable: true,
          foreign_key_table: 'directus_users',
          foreign_key_column: 'id',
          constraint_name: 'procesos_creado_por_foreign',
          on_delete: 'SET NULL',
        },
      }),
    });
    console.log('   ✅ procesos.creado_por creado');
  } else {
    console.log('   ✅ procesos.creado_por ya existe');
  }

  // Relación en directus_relations (el POST /fields la ignora)
  const relaciones = (await api('/relations?limit=-1')).data;
  const rel = relaciones.find((r) => r.collection === 'procesos' && r.field === 'creado_por');
  if (!rel) {
    await api('/relations', {
      method: 'POST',
      body: JSON.stringify({
        collection: 'procesos',
        field: 'creado_por',
        related_collection: 'directus_users',
        schema: { on_delete: 'SET NULL', on_update: 'CASCADE' },
        meta: { one_deselect_action: 'nullify', one_allowed_collections: [] },
      }),
    });
    console.log('   ✅ relación procesos.creado_por → directus_users (SET NULL)');
  } else {
    console.log(`   ✅ relación ya existe (on_delete=${rel.schema?.on_delete})`);
  }

  /* ---------- 2. Portal: escritura en procesos y pasos ---------- */
  console.log('\n[2/4] Permisos de la cuenta de servicio (policy Portal)');
  const policies = (await api('/policies?fields=id,name&limit=-1')).data;
  const portal = policies.find((p) => p.name === 'Portal — solo lectura');
  if (!portal) throw new Error('No existe la policy "Portal — solo lectura". Ejecuta npm run setup:access');
  const permsPortal = (await api(`/permissions?limit=-1&filter[policy][_eq]=${portal.id}`)).data;
  for (const collection of ['procesos', 'pasos']) {
    for (const action of ['create', 'update', 'delete']) {
      const r = await asegurarPermiso(
        { policy: portal.id, collection, action, permissions: {}, fields: ['*'] },
        permsPortal,
      );
      if (r !== 'ya existe') console.log(`   portal ${action} ${collection}: ${r}`);
    }
  }
  // Lectura de categorías para validar al crear (ya debería existir, por si acaso)
  const rCat = await asegurarPermiso(
    { policy: portal.id, collection: 'categorias', action: 'read', permissions: {}, fields: ['*'] },
    permsPortal,
  );
  if (rCat !== 'ya existe') console.log(`   portal read categorias: ${rCat}`);
  // Lectura de usuarios para resolver creado_por.email en la cola de revisión
  // (fields ['*']: el recorte por campo es recurso de pago y da 403)
  const rUsr = await asegurarPermiso(
    { policy: portal.id, collection: 'directus_users', action: 'read', permissions: {}, fields: ['*'] },
    permsPortal,
  );
  if (rUsr !== 'ya existe') console.log(`   portal read directus_users: ${rUsr}`);

  /* ---------- 3. Sin visitante: vaciar la policy pública ---------- */
  console.log('\n[3/4] Sin rol visitante (policy pública vacía)');
  const publica = policies.find((p) => p.name.includes('public_label')) || policies.find((p) => p.name === 'Public');
  if (!publica) {
    console.log('   ⚠ no se encontró la policy pública (ya eliminada o renombrada)');
  } else {
    const permsPub = (await api(`/permissions?limit=-1&filter[policy][_eq]=${publica.id}`)).data;
    if (permsPub.length === 0) {
      console.log('   ✅ policy pública ya vacía: sin acceso anónimo');
    } else {
      for (const p of permsPub) {
        await api(`/permissions/${p.id}`, { method: 'DELETE' });
        console.log(`   🗑 eliminado: ${p.collection}.${p.action} (id ${p.id})`);
      }
      console.log('   ✅ policy pública vacía: sin acceso anónimo');
    }
  }

  /* ---------- 4. Verificación de roles ---------- */
  console.log('\n[4/4] Roles de usuario');
  const roles = (await api('/roles?fields=id,name&limit=-1')).data;
  const nombres = roles.map((r) => r.name);
  console.log(`   roles: ${nombres.join(', ')}`);
  for (const esperado of ['agente', 'Editor', 'Administrator']) {
    if (!nombres.includes(esperado)) console.log(`   ⚠ falta el rol "${esperado}"`);
  }
  const visitantes = nombres.filter((n) => /visit|public|invitad/i.test(n));
  if (visitantes.length) console.log(`   ⚠ roles tipo visitante aún existen: ${visitantes.join(', ')}`);
  else console.log('   ✅ sin rol visitante: solo agente / Editor / Administrator (+ Portal interno)');

  console.log('\n✅ Workflow listo');
  console.log('   · agente propone (borrador) vía Next.js; no publica');
  console.log('   · editor/admin corrigen, validan (publicado) o eliminan');
  console.log('   · sin acceso anónimo: todo el portal exige login');
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
