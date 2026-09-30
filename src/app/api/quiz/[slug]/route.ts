/* ============================================================
   API: Get Quiz — Portal Capacitación RR / AS400
   Preguntas y opciones de un proceso, sin la respuesta correcta:
   esa se lee solo al calificar, en /api/quiz/intentos.
   ============================================================ */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { directusGet, idRelacion } from '@/lib/directus-api';

interface Item {
  /* Los ids de estas colecciones son enteros en Postgres; Directus los
     devuelve como número, no como texto. */
  id: string | number;
  titulo?: string;
  enunciado?: string;
  tipo?: string;
  texto?: string;
  pregunta?: string | number | { id: string | number } | null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { slug } = await params;

    const procesos = await directusGet<{ data: Item[] }>(
      `/items/procesos?filter[slug][_eq]=${encodeURIComponent(slug)}` +
        `&filter[estado][_eq]=publicado&fields=id,titulo&limit=1`,
    );
    const proceso = procesos.data[0];
    if (!proceso) {
      return NextResponse.json({ error: 'Proceso no encontrado' }, { status: 404 });
    }

    const preguntas = await directusGet<{ data: Item[] }>(
      `/items/quiz_preguntas?filter[proceso][_eq]=${proceso.id}` +
        `&filter[estado][_eq]=publicado&fields=id,enunciado,tipo,orden&sort=orden`,
    );

    /* Una sola consulta para todas las opciones del proceso, en vez de
       una por pregunta: /items/quiz_opciones?filter[pregunta][_in]=... */
    const ids = preguntas.data.map((p) => p.id);
    const opciones = ids.length
      ? await directusGet<{ data: Item[] }>(
          `/items/quiz_opciones?filter[pregunta][_in]=${ids.join(',')}` +
            `&fields=id,pregunta,texto,orden&sort=orden`,
        )
      : { data: [] as Item[] };

    /* Los dos lados de la comparación pasan por idRelacion: sin eso
       Map() no encuentra nada (1 !== "1") y las opciones salen
       vacías. */
    const porPregunta = new Map<string, Item[]>();
    for (const o of opciones.data) {
      const pid = idRelacion(o.pregunta);
      if (!pid) continue;
      const lista = porPregunta.get(pid) ?? [];
      lista.push(o);
      porPregunta.set(pid, lista);
    }

    return NextResponse.json({
      proceso: { id: proceso.id, titulo: proceso.titulo },
      preguntas: preguntas.data.map((p) => ({
        ...p,
        opciones: (porPregunta.get(idRelacion(p.id) ?? '') ?? []).map(({ id, texto }) => ({
          id,
          texto,
        })),
      })),
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener el quiz' },
      { status: 500 },
    );
  }
}
