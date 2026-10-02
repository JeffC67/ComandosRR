#!/usr/bin/env node
/* ==========================================================
   Verificación del workflow de procesos por rol
   · Sin visitante: anónimo 403 en contenido y assets (Directus)
     y redirección a /login en el portal.
   · agente propone (borrador), no publica, no edita publicados,
     no toca lo ajeno.
   · editor/admin: CRUD total + validar (borrador → publicado).
   · Antes de validar no se publica: el borrador no sale en
     listados publicados ni en getProcesoBySlug.
   Uso: node verify-workflow.mjs [--base http://127.0.0.1:3000]
   Requiere: Next.js corriendo (npm run dev) y Directus arriba.
   Limpia los procesos de prueba al final (slug test-wf-*).
   ========================================================== */

const NEXT = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : process.env.NEXT_BASE || 'http://127.0.0.1:3000';
const DIRECTUS = process.env.DIRECTUS_URL || 'http://127.0.0.1:8056';

const AGENTE = { email: 'agente.prueba@capacitacion-rr.co', password: 'AgenteTest123!' };
const EDITOR = { email: 'editor@capacitacion-rr.co', password: 'EditorTest123!' };
const ADMIN = { email: 'admin@capacitacion-rr.co', password: '' };

const resultados = [];
const check = (nombre, ok, detalle = '') => {
  resultados.push({ nombre, ok });
  console.log(`${ok ? '✅' : '❌'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
};

async function loginNext(email, password) {
  const res = await fetch(`${NEXT}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Login Next ${email} → ${res.status}: ${json?.error}`);
  const cookies = res.headers.getSetCookie?.() ?? [];
  const jar = cookies.map((c) => c.split(';')[0]).join('; ');
  return { rol: json.user.role, jar };
}

const conSesion = (jar) => ({
  'Content-Type': 'application/json',
  Cookie: jar,
});

async function main() {
  console.log(`→ Next: ${NEXT}\n→ Directus: ${DIRECTUS}\n`);

  /* ---------- 1. Sin visitante: Directus anónimo bloqueado ---------- */
  const anonCont = await fetch(`${DIRECTUS}/items/procesos?limit=1`);
  check('Anónimo sin contenido (Directus 403)', anonCont.status === 403, `HTTP ${anonCont.status}`);
  const anonAsset = await fetch(`${DIRECTUS}/assets/00000000-0000-0000-0000-000000000000`);
  check(
    'Anónimo sin assets (Directus 403/404)',
    anonAsset.status === 403 || anonAsset.status === 404,
    `HTTP ${anonAsset.status}`,
  );

  /* ---------- 2. Sin visitante: portal exige login ---------- */
  const sinSesion = await fetch(`${NEXT}/procesos`, { redirect: 'manual' });
  check(
    'Portal /procesos exige login',
    sinSesion.status === 307 || sinSesion.status === 308,
    `HTTP ${sinSesion.status} → ${sinSesion.headers.get('location')}`,
  );
  const rutaEliminada = await fetch(`${NEXT}/api/assets/00000000-0000-0000-0000-000000000000`);
  check('API /api/assets eliminada (404)', rutaEliminada.status === 404, `HTTP ${rutaEliminada.status}`);

  /* ---------- 3. Login por rol ---------- */
  const agente = await loginNext(AGENTE.email, AGENTE.password);
  check('Login agente (rol agente)', agente.rol === 'agente', `rol=${agente.rol}`);
  const editor = await loginNext(EDITOR.email, EDITOR.password);
  check('Login editor (rol editor)', editor.rol === 'editor', `rol=${editor.rol}`);
  // Admin: contraseña desde .env (no se hardcodea)
  const adminPw = await adminPassword();
  const admin = await loginNext(ADMIN.email, adminPw);
  check('Login admin (rol admin)', admin.rol === 'admin', `rol=${admin.rol}`);
  // Portal es cuenta de servicio: no entra por la UI
  const portalRes = await fetch(`${NEXT}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'portal@capacitacion-rr.co', password: 'x' }),
  });
  // Da 401 (credenciales) o 403 (rechazada): lo importante es que no entra como agente
  check('Cuenta Portal no entra por login UI', portalRes.status !== 200, `HTTP ${portalRes.status}`);

  /* ---------- 4. Agente propone (borrador, no publica) ---------- */
  const slugA = `test-wf-agente-${Date.now()}`;
  const crearAgente = await fetch(`${NEXT}/api/procesos`, {
    method: 'POST',
    headers: conSesion(agente.jar),
    body: JSON.stringify({
      titulo: 'WF Agente propone',
      slug: slugA,
      descripcion: 'Propuesta de agente para validación',
      estado: 'publicado', // intenta publicar directo: debe quedar borrador
      pasos: [{ contenido: 'Paso 1 de prueba' }],
    }),
  });
  const jAgente = await crearAgente.json().catch(() => null);
  check('Agente crea propuesta (201)', crearAgente.status === 201, `HTTP ${crearAgente.status}`);
  check(
    'Agente queda en borrador aunque pida publicado',
    jAgente?.estado === 'borrador' && jAgente?.pendiente === true,
    `estado=${jAgente?.estado}`,
  );
  const idAgente = jAgente?.id;

  // Antes de validar no se publica: no sale en listados ni detalle público
  const lista = await fetch(
    `${DIRECTUS}/items/procesos?filter[slug][_eq]=${slugA}&filter[estado][_eq]=publicado&fields=id&limit=1`,
    {
      headers: await adminAuth(),
    },
  );
  const listaJson = await lista.json();
  check('Borrador no publicado (sin fila publicada)', (listaJson.data ?? []).length === 0, '0 filas publicadas');

  /* ---------- 5. Agente no valida ni publica ---------- */
  const validarAgente = await fetch(`${NEXT}/api/procesos/${idAgente}/validar`, {
    method: 'POST',
    headers: conSesion(agente.jar),
  });
  check('Agente NO puede validar (403)', validarAgente.status === 403, `HTTP ${validarAgente.status}`);

  /* ---------- 6. Editor corrige + valida + publica ---------- */
  const editarEditor = await fetch(`${NEXT}/api/procesos/${idAgente}`, {
    method: 'PATCH',
    headers: conSesion(editor.jar),
    body: JSON.stringify({ descripcion: 'Corregido por editor' }),
  });
  check('Editor corrige propuesta ajena (200)', editarEditor.status === 200, `HTTP ${editarEditor.status}`);

  const validarEditor = await fetch(`${NEXT}/api/procesos/${idAgente}/validar`, {
    method: 'POST',
    headers: conSesion(editor.jar),
  });
  const jVal = await validarEditor.json().catch(() => null);
  check(
    'Editor valida y publica (200)',
    validarEditor.status === 200 && jVal?.ok === true,
    `HTTP ${validarEditor.status}`,
  );

  // Después de validar sí se publica
  const pub = await fetch(`${DIRECTUS}/items/procesos?filter[slug][_eq]=${slugA}&fields=id,estado&limit=1`, {
    headers: await adminAuth(),
  });
  const pubJson = await pub.json();
  check(
    'Tras validar está publicado',
    pubJson.data?.[0]?.estado === 'publicado',
    `estado=${pubJson.data?.[0]?.estado}`,
  );

  /* ---------- 7. Editor crea/edita/elimina directo ---------- */
  const slugE = `test-wf-editor-${Date.now()}`;
  const crearEditor = await fetch(`${NEXT}/api/procesos`, {
    method: 'POST',
    headers: conSesion(editor.jar),
    body: JSON.stringify({
      titulo: 'WF Editor crea',
      slug: slugE,
      descripcion: 'Creado por editor',
      estado: 'publicado',
      pasos: [{ contenido: 'Paso editor' }, { contenido: 'Paso 2' }],
    }),
  });
  const jEditor = await crearEditor.json().catch(() => null);
  check(
    'Editor crea publicado directo (201)',
    crearEditor.status === 201 && jEditor?.estado === 'publicado',
    `estado=${jEditor?.estado}`,
  );
  const idEditor = jEditor?.id;

  const borrarEditor = await fetch(`${NEXT}/api/procesos/${idEditor}`, {
    method: 'DELETE',
    headers: conSesion(editor.jar),
  });
  check('Editor elimina (200)', borrarEditor.status === 200, `HTTP ${borrarEditor.status}`);

  /* ---------- 8. Agente no toca lo ajeno/publicado ---------- */
  const editarAjeno = await fetch(`${NEXT}/api/procesos/${idAgente}`, {
    method: 'PATCH',
    headers: conSesion(agente.jar),
    body: JSON.stringify({ descripcion: 'Intento agente sobre publicado' }),
  });
  check('Agente NO edita publicado (403)', editarAjeno.status === 403, `HTTP ${editarAjeno.status}`);
  const borrarAjeno = await fetch(`${NEXT}/api/procesos/${idAgente}`, {
    method: 'DELETE',
    headers: conSesion(agente.jar),
  });
  check('Agente NO elimina publicado (403)', borrarAjeno.status === 403, `HTTP ${borrarAjeno.status}`);

  /* ---------- 9. Limpieza ---------- */
  const limpiar = await fetch(`${NEXT}/api/procesos/${idAgente}`, {
    method: 'DELETE',
    headers: conSesion(editor.jar),
  });
  check('Limpieza: editor elimina el publicado (200)', limpiar.status === 200, `HTTP ${limpiar.status}`);

  /* ---------- 10. Agente edita/elimina su propio borrador ---------- */
  const slugB = `test-wf-propio-${Date.now()}`;
  const crearB = await fetch(`${NEXT}/api/procesos`, {
    method: 'POST',
    headers: conSesion(agente.jar),
    body: JSON.stringify({
      titulo: 'WF Agente propio',
      slug: slugB,
      descripcion: 'Borrador propio',
      pasos: [{ contenido: 'Paso propio' }],
    }),
  });
  const jB = await crearB.json().catch(() => null);
  check('Agente crea 2º borrador (201)', crearB.status === 201, `HTTP ${crearB.status}`);
  const editarPropio = await fetch(`${NEXT}/api/procesos/${jB?.id}`, {
    method: 'PATCH',
    headers: conSesion(agente.jar),
    body: JSON.stringify({ descripcion: 'Editado por su autor' }),
  });
  check('Agente SÍ edita su borrador (200)', editarPropio.status === 200, `HTTP ${editarPropio.status}`);
  const borrarPropio = await fetch(`${NEXT}/api/procesos/${jB?.id}`, {
    method: 'DELETE',
    headers: conSesion(agente.jar),
  });
  check('Agente SÍ elimina su borrador (200)', borrarPropio.status === 200, `HTTP ${borrarPropio.status}`);

  /* ---------- 11. Admin CRUD total ---------- */
  const slugAdmin = `test-wf-admin-${Date.now()}`;
  const crearAdmin = await fetch(`${NEXT}/api/procesos`, {
    method: 'POST',
    headers: conSesion(admin.jar),
    body: JSON.stringify({
      titulo: 'WF Admin',
      slug: slugAdmin,
      descripcion: 'Creado por admin',
      estado: 'publicado',
      pasos: [{ contenido: 'Paso admin' }],
    }),
  });
  const jAdmin = await crearAdmin.json().catch(() => null);
  check(
    'Admin crea publicado (201)',
    crearAdmin.status === 201 && jAdmin?.estado === 'publicado',
    `estado=${jAdmin?.estado}`,
  );
  const borrarAdmin = await fetch(`${NEXT}/api/procesos/${jAdmin?.id}`, {
    method: 'DELETE',
    headers: conSesion(admin.jar),
  });
  check('Admin elimina (200)', borrarAdmin.status === 200, `HTTP ${borrarAdmin.status}`);

  /* ---------- 12. Video público en /media con Range 206 ---------- */
  const vids = await fetch(`${DIRECTUS}/items/videos?fields=archivo&limit=1`, {
    headers: await adminAuth(),
  }).then((r) => r.json());
  const nombre = vids.data?.[0]?.archivo;
  if (nombre) {
    const rango = await fetch(`${NEXT}/media/${encodeURIComponent(nombre)}`, {
      headers: { Range: 'bytes=0-10' },
    });
    check('Video en /media soporta Range (206)', rango.status === 206, `HTTP ${rango.status}`);
  } else {
    check('Video en /media soporta Range (206)', false, 'sin videos en Directus');
  }

  const fallidos = resultados.filter((r) => !r.ok).length;
  console.log(
    `\n${fallidos === 0 ? '✅ WORKFLOW VERIFICADO' : `❌ ${fallidos} comprobación(es) fallida(s)`} (${resultados.length} total)`,
  );
  process.exit(fallidos === 0 ? 0 : 1);
}

async function adminPassword() {
  if (process.env.DIRECTUS_ADMIN_PASSWORD) return process.env.DIRECTUS_ADMIN_PASSWORD;
  const { readFileSync, existsSync } = await import('node:fs');
  const { resolve, dirname } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const file = resolve(root, '.env');
  if (existsSync(file)) {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*DIRECTUS_ADMIN_PASSWORD\s*=\s*(.*)\s*$/);
      if (m) return m[1];
    }
  }
  throw new Error('Falta DIRECTUS_ADMIN_PASSWORD para el login admin');
}

async function adminAuth() {
  const email = process.env.DIRECTUS_ADMIN_EMAIL || 'admin@capacitacion-rr.co';
  const password = process.env.DIRECTUS_ADMIN_PASSWORD || '';
  // Lee .env si falta la contraseña en el entorno
  let pw = password;
  if (!pw) {
    const { readFileSync, existsSync } = await import('node:fs');
    const { resolve, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
    const file = resolve(root, '.env');
    if (existsSync(file)) {
      for (const line of readFileSync(file, 'utf8').split('\n')) {
        const m = line.match(/^\s*DIRECTUS_ADMIN_PASSWORD\s*=\s*(.*)\s*$/);
        if (m) pw = m[1];
      }
    }
  }
  const res = await fetch(`${DIRECTUS}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pw }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Admin login falló: ${JSON.stringify(json)}`);
  return { Authorization: `Bearer ${json.data.access_token}` };
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
