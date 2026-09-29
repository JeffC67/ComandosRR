#!/usr/bin/env node
/* ==========================================================
   Configuración de acceso — Fase 1
   · Policy PÚBLICA:  solo lectura de assets (directus_files)
     → El contenido NO es consultable por anónimos: el filtrado
       "solo publicado" se hace en el servidor (Next.js, Fase 2).
       Motivo: Directus 12 paywala los permisos con reglas
       condicionales (entitlement custom_permission_rules_enabled).
   · Rol EDITOR:      CRUD de contenido (panel Directus)
   · Usuario de prueba editor@capacitacion-rr.co / EditorTest123!
   Uso: node setup-access.mjs
   ========================================================== */

import { login, api, BASE } from './migrate.mjs';

const CONTENT = ['modulos', 'comandos', 'procesos', 'pasos', 'videos'];

const exists = (list, policy, collection, action) =>
  list.some((p) => p.policy === policy && p.collection === collection && p.action === action);

async function ensurePermission(body, actual) {
  if (exists(actual, body.policy, body.collection, body.action)) return 'ya existe';
  await api('/permissions', { method: 'POST', body: JSON.stringify(body) });
  return 'creado';
}

async function main() {
  console.log(`→ Directus: ${BASE}`);
  await login();

  /* ---------- 1. Policy pública: solo assets ---------- */
  const policies = (await api('/policies?fields=id,name')).data;
  const publicPolicy =
    policies.find((p) => p.name.includes('public_label')) || policies.find((p) => p.name === 'Public');
  if (!publicPolicy) throw new Error('No se encontró la policy pública');
  console.log(`→ Policy pública: ${publicPolicy.id}`);

  const actual = await api(`/permissions?limit=-1&filter[policy][_eq]=${publicPolicy.id}`);
  const estado = await ensurePermission(
    { policy: publicPolicy.id, collection: 'directus_files', action: 'read', permissions: {}, fields: ['*'] },
    actual.data,
  );
  console.log(`   public read directus_files: ${estado}`);

  /* ---------- 2. Rol + policy de Editor ---------- */
  const roles = (await api('/roles?fields=id,name&limit=-1')).data;
  let editor = roles.find((r) => r.name === 'Editor');
  if (!editor) {
    editor = (await api('/roles', { method: 'POST', body: JSON.stringify({ name: 'Editor', icon: 'badge' }) })).data;
    console.log(`→ Rol Editor creado: ${editor.id}`);
  } else {
    console.log(`→ Rol Editor ya existe: ${editor.id}`);
  }

  const policies2 = (await api('/policies?fields=id,name&limit=-1')).data;
  let editorPolicy = policies2.find((p) => p.name === 'Editor de contenido');
  if (!editorPolicy) {
    editorPolicy = (
      await api('/policies', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Editor de contenido',
          icon: 'badge',
          admin_access: false,
          app_access: true,
        }),
      })
    ).data;
    console.log(`→ Policy Editor creada: ${editorPolicy.id}`);
  } else {
    console.log(`→ Policy Editor ya existe: ${editorPolicy.id}`);
  }

  // Vínculo policy ↔ rol: en Directus 12 es el endpoint /access
  // (el campo "roles" de /policies devuelve 403 aunque seas admin)
  const access = (await api(`/access?limit=-1&filter[policy][_eq]=${editorPolicy.id}`)).data;
  if (!access.some((a) => a.role === editor.id)) {
    await api('/access', {
      method: 'POST',
      body: JSON.stringify({ policy: editorPolicy.id, role: editor.id }),
    });
    console.log('   vínculo policy↔rol creado (POST /access)');
  } else {
    console.log('   vínculo policy↔rol ya existe');
  }

  const permisosEditor = await api(`/permissions?limit=-1&filter[policy][_eq]=${editorPolicy.id}`);
  for (const c of [...CONTENT, 'directus_files']) {
    for (const action of ['create', 'read', 'update', 'delete']) {
      const r = await ensurePermission(
        { policy: editorPolicy.id, collection: c, action, permissions: {}, fields: ['*'] },
        permisosEditor.data,
      );
      if (r !== 'ya existe') console.log(`   editor ${action} ${c}: ${r}`);
    }
  }

  /* ---------- 3. Usuario de prueba editor ---------- */
  const users = (await api('/users?fields=id,email,role&limit=-1')).data;
  const editorUser = users.find((u) => u.email === 'editor@capacitacion-rr.co');
  if (!editorUser) {
    await api('/users', {
      method: 'POST',
      body: JSON.stringify({
        email: 'editor@capacitacion-rr.co',
        password: 'EditorTest123!',
        role: editor.id,
        status: 'active',
      }),
    });
    console.log('→ Usuario editor de prueba creado: editor@capacitacion-rr.co / EditorTest123!');
  } else {
    console.log(`→ Usuario editor ya existe: ${editorUser.email}`);
  }

  console.log('\n✅ Acceso configurado');
  console.log('   · Público: solo assets (videos); contenido vía servidor en Fase 2');
  console.log('   · Editor: CRUD de contenido en el panel /admin');
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
