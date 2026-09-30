/* ============================================================
   API: Submit Quiz — Portal Capacitación RR / AS400
   Califica el intento contra las respuestas correctas y lo guarda.
   Es el único punto donde se leen `es_correcta`: el GET de /api/quiz/[slug]
   nunca las expone al cliente.
   ============================================================ */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { directusGet, directusPost, idRelacion } from '@/lib/directus-api';

interface Pregunta {
  /* Los id de estas tablas son enteros en Postgres. */
  id: string | number;
  tipo: string;
}

interface Opcion {
  id: string | number;
  pregunta?: string | number | { id: string | number } | null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { quiz, respuestas } = await request.json();
    if (!quiz || !respuestas) {
      return NextResponse.json({ error: 'quiz y respuestas requeridos' }, { status: 400 });
    }

    const preguntas = (
      await directusGet<{ data: Pregunta[] }>(
        `/items/quiz_preguntas?filter[proceso][_eq]=${encodeURIComponent(String(quiz))}` +
          `&filter[estado][_eq]=publicado&fields=id,tipo`,
      )
    ).data;

    const ids = preguntas.map((p) => p.id);
    const correctas = ids.length
      ? (
          await directusGet<{ data: Opcion[] }>(
            `/items/quiz_opciones?filter[pregunta][_in]=${ids.join(',')}` +
              `&filter[es_correcta][_eq]=true&fields=id,pregunta`,
          )
        ).data
      : [];

    /* Todo id pasa por idRelacion antes de entrar en un Map o un Set:
       los que vienen de Directus son números y los que vienen del
       cliente son texto, y una clave 1 nunca encuentra a "1". */
    const porPregunta = new Map<string, Set<string>>();
    for (const o of correctas) {
      const pid = idRelacion(o.pregunta);
      if (!pid) continue;
      const set = porPregunta.get(pid) ?? new Set<string>();
      const oid = idRelacion(o.id);
      if (oid) set.add(oid);
      porPregunta.set(pid, set);
    }

    let aciertos = 0;
    for (const p of preguntas) {
      const clave = idRelacion(p.id) ?? '';
      /* El cliente manda texto; por si manda un solo valor en vez de
         lista (pregunta de respuesta única), se normaliza igual. */
      const enviadas = respuestas[p.id] ?? respuestas[clave];
      const lista = Array.isArray(enviadas) ? enviadas : enviadas == null ? [] : [enviadas];
      const dadas = new Set(lista.map((v) => idRelacion(v) ?? '').filter(Boolean));
      const esperadas = porPregunta.get(clave) ?? new Set<string>();

      if (p.tipo === 'unica') {
        if (dadas.size === 1 && esperadas.has([...dadas][0])) aciertos++;
      } else if (
        dadas.size === esperadas.size &&
        [...esperadas].every((id) => dadas.has(id))
      ) {
        /* Opción múltiple: acierta solo si marca todas y no marca ninguna de más */
        aciertos++;
      }
    }

    const total = preguntas.length;
    const puntaje = total > 0 ? Math.round((aciertos / total) * 100) : 0;

    await directusPost('/items/quiz_intentos', {
      agente: session.sub,
      proceso: quiz,
      puntaje,
      respuestas: JSON.stringify(respuestas),
    });

    return NextResponse.json({ puntaje, total, correctas: aciertos });
  } catch (error) {
    console.error('Submit quiz error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al enviar el quiz' },
      { status: 500 },
    );
  }
}
