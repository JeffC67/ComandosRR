#!/usr/bin/env node
/* ==========================================================
   Seed Quiz Data — Fase 3: Preguntas de prueba para quiz
   ========================================================== */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

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
const BASE = process.env.DIRECTUS_URL || `http://127.0.0.1:${env.DIRECTUS_PORT || 8056}`;

let token = null;

async function api(path, options = {}) {
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

async function main() {
  console.log(`→ Directus: ${BASE}`);
  await login();

  // Obtener procesos
  const procesosRes = await api('/items/procesos?fields=id,slug,titulo&limit=-1');
  const procesos = procesosRes.data;
  console.log(`\n→ Procesos encontrados: ${procesos.length}`);

  for (const proceso of procesos) {
    console.log(`\n📋 ${proceso.titulo} (${proceso.slug})`);

    // Verificar si ya tiene preguntas
    const existing = await api(`/items/quiz_preguntas?filter[proceso][_eq]=${proceso.id}&fields=id&limit=1`);
    if (existing.data.length > 0) {
      console.log(`  ⚠️  Ya tiene ${existing.data.length} preguntas, saltando...`);
      continue;
    }

    // Preguntas por proceso
    const preguntas = getPreguntasForProceso(proceso.slug);

    for (let i = 0; i < preguntas.length; i++) {
      const p = preguntas[i];

      // Crear pregunta
      const preguntaRes = await api('/items/quiz_preguntas', {
        method: 'POST',
        body: JSON.stringify({
          proceso: proceso.id,
          enunciado: p.enunciado,
          tipo: p.tipo,
          orden: i + 1,
          estado: 'publicado',
        }),
      });

      const preguntaId = preguntaRes.data.id;
      console.log(`  ✅ Pregunta ${i + 1}: ${p.enunciado.substring(0, 50)}...`);

      // Crear opciones
      for (let j = 0; j < p.opciones.length; j++) {
        const opt = p.opciones[j];
        await api('/items/quiz_opciones', {
          method: 'POST',
          body: JSON.stringify({
            pregunta: preguntaId,
            texto: opt.texto,
            es_correcta: opt.es_correcta,
            orden: j + 1,
          }),
        });
      }
      console.log(`     → ${p.opciones.length} opciones creadas`);
    }
  }

  console.log('\n✅ Seed de quiz completado');
}

function getPreguntasForProceso(slug) {
  const bancos = {
    'creacion-de-pqr': [
      {
        enunciado: '¿Cuál es la tecla para ingresar y registrar la marcación correspondiente en la creación de PQR?',
        tipo: 'unica',
        opciones: [
          { texto: 'F7', es_correcta: false },
          { texto: 'F22', es_correcta: true },
          { texto: 'F13', es_correcta: false },
          { texto: 'F5', es_correcta: false },
        ],
      },
      {
        enunciado: '¿Qué combinación de teclas finaliza la radicación de una solicitud PQR?',
        tipo: 'unica',
        opciones: [
          { texto: 'F5 + F5', es_correcta: true },
          { texto: 'F7 + F7', es_correcta: false },
          { texto: 'F22 + F22', es_correcta: false },
          { texto: 'Enter + Enter', es_correcta: false },
        ],
      },
      {
        enunciado: '¿En qué tecla se registran las notas detalladas de la solicitud?',
        tipo: 'unica',
        opciones: [
          { texto: 'F7', es_correcta: true },
          { texto: 'F8', es_correcta: false },
          { texto: 'F13', es_correcta: false },
          { texto: 'F22', es_correcta: false },
        ],
      },
      {
        enunciado: '¿Cuál de los siguientes pasos NO forma parte del proceso de creación de PQR?',
        tipo: 'unica',
        opciones: [
          { texto: 'Presionar F22 para registrar marcación', es_correcta: false },
          { texto: 'Presionar Enter para confirmar', es_correcta: false },
          { texto: 'Presionar F5 + F5 para completar radicación', es_correcta: false },
          { texto: 'Presionar F15 + F6 para crear OT', es_correcta: true },
        ],
      },
      {
        enunciado: 'Selecciona las acciones correctas para completar un PQR (múltiple):',
        tipo: 'multiple',
        opciones: [
          { texto: 'Presionar F22 para ingresar y registrar marcación', es_correcta: true },
          { texto: 'Presionar Enter para confirmar', es_correcta: true },
          { texto: 'Presionar F7 para dejar notas detalladas', es_correcta: true },
          { texto: 'Presionar F15 + F6 para crear carpeta', es_correcta: false },
        ],
      },
    ],
    'ajuste-creer-en-el-cliente': [
      {
        enunciado: '¿Qué código se usa para un Ajuste Creer en el Cliente en RR/AS400?',
        tipo: 'unica',
        opciones: [
          { texto: 'AJU-CEC', es_correcta: true },
          { texto: 'AJU-CLL', es_correcta: false },
          { texto: 'AJU-OT', es_correcta: false },
          { texto: 'AJU-PQR', es_correcta: false },
        ],
      },
      {
        enunciado: '¿Qué combinación de teclas crea la carpeta con el nombre "Creer en el cliente"?',
        tipo: 'unica',
        opciones: [
          { texto: 'F7 + F6', es_correcta: true },
          { texto: 'F5 + F5', es_correcta: false },
          { texto: 'F22 + F22', es_correcta: false },
          { texto: 'F13 + F13', es_correcta: false },
        ],
      },
      {
        enunciado: 'En la plataforma DIME, ¿a qué sección se navega para escalar un ajuste online?',
        tipo: 'unica',
        opciones: [
          { texto: 'Mis accesos → Ajuste Online', es_correcta: true },
          { texto: 'Gestión → Ajustes', es_correcta: false },
          { texto: 'Reportes → Escalamientos', es_correcta: false },
          { texto: 'Configuración → Ajustes', es_correcta: false },
        ],
      },
      {
        enunciado: '¿Qué datos se completan automáticamente al ingresar el número de radicado PQR en DIME?',
        tipo: 'multiple',
        opciones: [
          { texto: 'Nombre del cliente', es_correcta: true },
          { texto: 'Dirección del cliente', es_correcta: true },
          { texto: 'Estado de la solicitud', es_correcta: true },
          { texto: 'Código de vendedor', es_correcta: false },
        ],
      },
      {
        enunciado: '¿Cuál es el último paso para escalar la solicitud en DIME?',
        tipo: 'unica',
        opciones: [
          { texto: 'Hacer clic en Escalar Solicitud', es_correcta: true },
          { texto: 'Seleccionar subcategoría', es_correcta: false },
          { texto: 'Ingresar número de cuenta', es_correcta: false },
          { texto: 'Digitar ticket PQR', es_correcta: false },
        ],
      },
    ],
    'replanteamiento-de-acometida': [
      {
        enunciado: '¿Qué combinación de teclas crea la Orden de Trabajo (OT)?',
        tipo: 'unica',
        opciones: [
          { texto: 'F15 + F6', es_correcta: true },
          { texto: 'F13 + F6', es_correcta: false },
          { texto: 'F7 + F6', es_correcta: false },
          { texto: 'F5 + F5', es_correcta: false },
        ],
      },
      {
        enunciado: '¿Qué valor se coloca en el campo TOMA para un replanteamiento?',
        tipo: 'unica',
        opciones: [
          { texto: '1', es_correcta: true },
          { texto: '0', es_correcta: false },
          { texto: 'N', es_correcta: false },
          { texto: 'Y', es_correcta: false },
        ],
      },
      {
        enunciado: '¿Qué se debe hacer con las opciones Y/N al presionar F2 + F2?',
        tipo: 'unica',
        opciones: [
          { texto: 'Cambiar de Y a N', es_correcta: true },
          { texto: 'Dejar en Y', es_correcta: false },
          { texto: 'Cambiar de N a Y', es_correcta: false },
          { texto: 'Eliminar el campo', es_correcta: false },
        ],
      },
      {
        enunciado: '¿Qué código se escribe en el campo "Clase de orden"?',
        tipo: 'unica',
        opciones: [
          { texto: 'VO', es_correcta: true },
          { texto: 'OT', es_correcta: false },
          { texto: 'AC', es_correcta: false },
          { texto: 'RP', es_correcta: false },
        ],
      },
      {
        enunciado: 'Para un replanteamiento SIN COSTO, ¿qué acción se realiza con el valor del campo TOMA?',
        tipo: 'unica',
        opciones: [
          { texto: 'Retirar el valor borrando el "1"', es_correcta: true },
          { texto: 'Cambiar a 0', es_correcta: false },
          { texto: 'Dejar en 1', es_correcta: false },
          { texto: 'Duplicar el valor', es_correcta: false },
        ],
      },
      {
        enunciado: 'Selecciona los pasos correctos para un replanteamiento sin costo (múltiple):',
        tipo: 'multiple',
        opciones: [
          { texto: 'Ingresar a F15 y presionar Enter', es_correcta: true },
          { texto: 'Quitar el 1 del campo TOMA y presionar Enter', es_correcta: true },
          { texto: 'Presionar F2 + F2 y cambiar Y por N', es_correcta: true },
          { texto: 'Crear nueva OT con F15 + F6', es_correcta: false },
        ],
      },
    ],
  };

  return bancos[slug] || [];
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});