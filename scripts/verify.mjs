#!/usr/bin/env node
/* ==========================================================
   Verificación de la Fase 1: compara el contenido de
   src/data/*.json (fuente de verdad) contra lo que hay en Directus.
   Uso: node verify.mjs
   Sale con código 1 si alguna comprobación falla.
   ========================================================== */

import { parse, login, api, BASE } from './migrate.mjs';

const resultados = [];
const check = (nombre, ok, detalle = '') => {
  resultados.push({ nombre, ok, detalle });
  console.log(`${ok ? '✅' : '❌'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
};

async function main() {
  console.log(`→ Verificando ${BASE}\n`);
  await login();

  const esperado = parse(); // lo que dicen los datos de src/data

  /* 1. Conteos */
  const cuentas = {};
  for (const c of ['modulos', 'comandos', 'procesos', 'pasos', 'videos']) {
    const r = await api(`/items/${c}?limit=-1&meta=total_count`);
    cuentas[c] = { total: r.meta.total_count, items: r.data };
  }

  const esperadoPasos = esperado.procesos.reduce((n, p) => n + p._pasos.length, 0);
  const conteos = [
    ['modulos', esperado.modulos.length, cuentas.modulos.total],
    ['comandos', esperado.comandos.length, cuentas.comandos.total],
    ['procesos', esperado.procesos.length, cuentas.procesos.total],
    ['pasos', esperadoPasos, cuentas.pasos.total],
    ['videos', esperado.videos.length, cuentas.videos.total],
  ];
  for (const [nombre, exp, real] of conteos) {
    check(`Conteo de ${nombre}`, exp === real, `esperado ${exp} · real ${real}`);
  }

  /* 2. Módulos: slugs y títulos */
  const apiMods = new Map(cuentas.modulos.items.map((m) => [m.slug, m]));
  for (const m of esperado.modulos) {
    const real = apiMods.get(m.slug);
    check(
      `Módulo ${m.slug}`,
      !!real && real.titulo === m.titulo && real.orden === m.orden,
      real ? `"${real.titulo}" orden ${real.orden}` : 'NO EXISTE',
    );
  }
  check(
    'Sin módulos extra',
    apiMods.size === esperado.modulos.length,
    `${apiMods.size} en API`,
  );

  /* 3. Comandos: etiqueta + tecla + tipo, por módulo
     (la clave incluye el módulo: hay comandos repetidos entre módulos,
      p. ej. "Historial de factura|F13" aparece en dos secciones) */
  const apiCmds = cuentas.comandos.items;
  const modById = new Map(cuentas.modulos.items.map((m) => [m.id, m.slug]));
  const keyCmd = (modulo, c) => `${modulo}|${c.etiqueta}|${c.tecla}`;
  const apiCmdMap = new Map(apiCmds.map((c) => [keyCmd(modById.get(c.modulo), c), c]));
  let cmdsOk = 0;
  const cmdsFaltan = [];
  for (const c of esperado.comandos) {
    const real = apiCmdMap.get(keyCmd(c._modulo, c));
    if (real && real.tipo === c.tipo && real.estado === 'publicado') cmdsOk++;
    else cmdsFaltan.push(`${c._modulo}:${c.tecla}`);
  }
  check(
    'Comandos 1:1 (etiqueta, tecla, tipo, estado)',
    cmdsOk === esperado.comandos.length && apiCmds.length === esperado.comandos.length,
    `${cmdsOk}/${esperado.comandos.length} correctos${cmdsFaltan.length ? ` · fallan: ${cmdsFaltan.join(', ')}` : ''}`,
  );

  // Orden dentro de cada módulo
  const ordenOk = esperado.comandos.every((c) => {
    const real = apiCmdMap.get(keyCmd(c._modulo, c));
    const modId = apiMods.get(c._modulo)?.id;
    return real && real.orden === c.orden && real.modulo === modId;
  });
  check('Comandos: orden y módulo asignado', ordenOk);

  /* 4. Procesos + pasos */
  const apiProc = new Map(cuentas.procesos.items.map((p) => [p.slug, p]));
  for (const p of esperado.procesos) {
    const real = apiProc.get(p.slug);
    check(
      `Proceso ${p.slug}`,
      !!real && real.titulo === p.titulo && real.duracion_min === p.duracion_min,
      real ? `"${real.titulo}" · ${real.duracion_min} min` : 'NO EXISTE',
    );

    const pasosReales = cuentas.pasos.items
      .filter((s) => s.proceso === real?.id)
      .sort((a, b) => a.orden - b.orden);

    check(
      `Pasos de ${p.slug}`,
      pasosReales.length === p._pasos.length,
      `esperados ${p._pasos.length} · reales ${pasosReales.length}`,
    );

    const contenidoOk = p._pasos.every((s, i) => {
      const r = pasosReales[i];
      return r && r.contenido === s.contenido && r.grupo === (s.grupo ?? null);
    });
    check(`Contenido de pasos de ${p.slug}`, contenidoOk, 'orden + grupo + HTML');
  }

  /* 5. Videos */
  for (const v of esperado.videos) {
    const real = cuentas.videos.items.find((x) => x.titulo === v.titulo);
    check(`Video "${v.titulo}"`, !!real && !!real.archivo, real?.archivo ? 'archivo subido' : 'sin archivo');
  }

  /* 6. Rango de bytes del video (barra de progreso del reproductor) */
  const vid = cuentas.videos.items.find((v) => v.archivo);
  if (vid) {
    const res = await fetch(`${BASE}/assets/${vid.archivo}`, {
      headers: { Range: 'bytes=0-1023' },
    });
    check(
      'Video soporta Range (206)',
      res.status === 206,
      `HTTP ${res.status} · ${res.headers.get('content-range') || 'sin content-range'}`,
    );
  } else {
    check('Video soporta Range (206)', false, 'no hay videos con archivo');
  }

  /* 7. Sin borradores por accidente */
  const borradores = ['modulos', 'comandos', 'procesos', 'videos'].flatMap((c) =>
    cuentas[c].items.filter((i) => i.estado !== 'publicado').map((i) => `${c}#${i.id}`),
  );
  check('Todo el contenido está publicado', borradores.length === 0, borradores.join(', '));

  /* 8. Aislamiento de anónimos + filtro de borradores */
  const anon = await fetch(`${BASE}/items/comandos?limit=1`);
  check('Anónimo sin acceso directo al contenido', anon.status === 403, `HTTP ${anon.status}`);

  const anonFiles = await fetch(`${BASE}/assets/${vid?.archivo || ''}`, { headers: { Range: 'bytes=0-10' } });
  check('Anónimo SÍ puede ver los videos (assets)', anonFiles.status === 206, `HTTP ${anonFiles.status}`);

  // El filtrado "solo publicado" (que usará el servidor en Fase 2) excluye borradores
  const draft = await api('/items/comandos', {
    method: 'POST',
    body: JSON.stringify({ etiqueta: 'BORRADOR-TEST', tecla: 'F0', tipo: 'basico', estado: 'borrador' }),
  });
  // Ojo: meta=total_count ignora el filtro; el que lo respeta es filter_count
  const publicados = await api(
    '/items/comandos?filter[estado][_eq]=publicado&fields=etiqueta&limit=-1&meta=filter_count',
  );
  const oculto =
    !publicados.data.some((c) => c.etiqueta === 'BORRADOR-TEST') &&
    publicados.meta.filter_count === esperado.comandos.length;
  check(
    'Borrador excluido por filtro de publicados',
    oculto,
    `publicados ${publicados.meta.filter_count} · datos sin borrador`,
  );
  await api(`/items/comandos/${draft.data.id}`, { method: 'DELETE' });

  /* Resumen */
  const fallidos = resultados.filter((r) => !r.ok).length;
  console.log(`\n${fallidos === 0 ? '✅ VERIFICACIÓN PASADA' : `❌ ${fallidos} comprobación(es) fallida(s)`} (${resultados.length} total)`);
  process.exit(fallidos === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
