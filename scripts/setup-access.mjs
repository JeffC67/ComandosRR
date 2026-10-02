#!/usr/bin/env node
/* ==========================================================
   Configuración de acceso — Fase 1
   · Policy PÚBLICA:  solo lectura de assets (directus_files)
     → El contenido NO es consultable por anónimos: el filtrado
       "solo publicado" se hace en el servidor (Next.js, Fase 2).
       Motivo: Directus 12 paywala los permisos con reglas
       condicionales (entitlement custom_permission_rules_enabled).
   · Rol EDITOR:      CRUD de contenido (panel Directus)
   · Rol PORTAL:      solo lectura del contenido — es la cuenta que
     usa el frontend (Next.js) para leer desde el servidor.
     Directus 12 eliminó los tokens estáticos, así que el servidor
     inicia sesión con esta cuenta y el SDK refresca la sesión sola.
   · Usuario de prueba editor@capacitacion-rr.co / EditorTest123!
   Uso: node setup-access.mjs
   ========================================================== */

import { login, api, BASE } from './migrate.mjs';

const CONTENT = ['modulos', 'comandos', 'categorias', 'procesos', 'pasos', 'videos'];

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

  /* Rol agente (solo etiqueta: la app valida el nombre en el login y lee
     los datos con la cuenta de servicio; no lleva policies ni permisos).
     Se crea aquí para no depender de un alta manual en /admin. */
  let agente = roles.find((r) => r.name === 'agente');
  if (!agente) {
    agente = (
      await api('/roles', {
        method: 'POST',
        body: JSON.stringify({
          name: 'agente',
          icon: 'person',
          description: 'Agente de call center - acceso a su progreso y quiz',
        }),
      })
    ).data;
    console.log(`→ Rol agente creado: ${agente.id}`);
  } else {
    console.log(`→ Rol agente ya existe: ${agente.id}`);
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

  /* ---------- 4. Cuenta de servicio del portal (solo lectura) ----------
     El frontend lee el contenido desde el servidor. Directus 12 ya no
     tiene tokens estáticos, así que el servidor inicia sesión con esta
     cuenta y refresca la sesión sola. Es de solo lectura a propósito:
     el Next.js nunca escribe, solo el panel de Directus. */
  const serviceEmail = process.env.DIRECTUS_SERVICE_EMAIL || 'portal@capacitacion-rr.co';

  const policiesList = (await api('/policies?fields=id,name')).data;
  let servicePolicy = policiesList.find((p) => p.name === 'Portal — solo lectura');
  if (!servicePolicy) {
    servicePolicy = (
      await api('/policies', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Portal — solo lectura',
          icon: 'visibility',
          admin_access: false,
          app_access: false,
        }),
      })
    ).data;
    console.log('→ Policy "Portal — solo lectura" creada');
  }

  let serviceRole = roles.find((r) => r.name === 'Portal');
  if (!serviceRole) {
    serviceRole = (
      await api('/roles', { method: 'POST', body: JSON.stringify({ name: 'Portal', icon: 'visibility' }) })
    ).data;
    console.log('→ Rol "Portal" creado');
  }

  const serviceAccess = (await api(`/access?limit=-1&filter[policy][_eq]=${servicePolicy.id}`)).data;
  if (!serviceAccess.some((a) => a.role === serviceRole.id)) {
    await api('/access', {
      method: 'POST',
      body: JSON.stringify({ policy: servicePolicy.id, role: serviceRole.id }),
    });
  }

  const permisosService = await api(`/permissions?limit=-1&filter[policy][_eq]=${servicePolicy.id}`);
  for (const c of [...CONTENT, 'directus_files']) {
    const r = await ensurePermission(
      { policy: servicePolicy.id, collection: c, action: 'read', permissions: {}, fields: ['*'] },
      permisosService.data,
    );
    if (r !== 'ya existe') console.log(`   portal read ${c}: ${r}`);
  }

  /* La cuenta de servicio también registra los intentos de quiz de los
     agentes (fase 3): escritura en quiz_intentos y lectura de las
     preguntas y sus opciones. El contenido de la fase 1 y 2 sigue
     siendo de solo lectura. */
  const FASE3 = ['quiz_intentos'];
  const FASE3_LECTURA = ['quiz_preguntas', 'quiz_opciones'];

  /* La API responde 403 (no 404) cuando la colección no existe, así que
     la comprobación se hace contra el listado, no contra /collections/<x>. */
  const colecciones = (await api('/collections?limit=-1&fields=collection')).data.map((c) => c.collection);
  const quizExiste = colecciones.includes('quiz_intentos');
  if (quizExiste) {
    for (const c of FASE3) {
      for (const action of ['create', 'read']) {
        const r = await ensurePermission(
          { policy: servicePolicy.id, collection: c, action, permissions: {}, fields: ['*'] },
          permisosService.data,
        );
        if (r !== 'ya existe') console.log(`   portal ${action} ${c}: ${r}`);
      }
    }
    for (const c of FASE3_LECTURA) {
      const r = await ensurePermission(
        { policy: servicePolicy.id, collection: c, action: 'read', permissions: {}, fields: ['*'] },
        permisosService.data,
      );
      if (r !== 'ya existe') console.log(`   portal read ${c}: ${r}`);
    }
  } else {
    console.log('   · fase 3 sin instalar: quiz aún no tiene permisos (ejecuta setup:phase3)');
  }

  const allUsers = (await api('/users?fields=id,email,role&limit=-1')).data;
  let serviceUser = allUsers.find((u) => u.email === serviceEmail);
  if (!serviceUser) {
    const password = process.env.DIRECTUS_SERVICE_PASSWORD || crypto.randomUUID();
    serviceUser = (
      await api('/users', {
        method: 'POST',
        body: JSON.stringify({ email: serviceEmail, password, role: serviceRole.id, status: 'active' }),
      })
    ).data;
    console.log(`→ Cuenta de servicio creada: ${serviceEmail}`);
    console.log(`   DIRECTUS_SERVICE_PASSWORD=${password}`);
    console.log('   ⚠ cópiala en .env.local — no se vuelve a mostrar');
  } else {
    console.log(`→ Cuenta de servicio ya existe: ${serviceEmail}`);
  }

  console.log('\n✅ Acceso configurado');
  console.log('   · Público: solo assets (videos); el contenido lo lee el servidor');
  console.log('   · Portal:  solo lectura del contenido (cuenta del frontend)');
  console.log('   · Editor:  CRUD de contenido en el panel /admin');
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
