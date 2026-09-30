/* ============================================================
   API: Completar Proceso — Portal Capacitación RR / AS400
   ============================================================ */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { directusGet, directusPost } from '@/lib/directus-api';

interface FilaProgreso {
  id: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { procesoId } = await request.json();
    if (!procesoId) {
      return NextResponse.json({ error: 'procesoId requerido' }, { status: 400 });
    }

    const filtro =
      `?filter[agente][_eq]=${encodeURIComponent(session.sub)}` +
      `&filter[proceso][_eq]=${encodeURIComponent(String(procesoId))}&fields=id&limit=1`;

    const existente = await directusGet<{ data: FilaProgreso[] }>(`/items/progreso${filtro}`);
    if (existente.data.length > 0) {
      return NextResponse.json({ success: true, already: true });
    }

    await directusPost('/items/progreso', {
      agente: session.sub,
      proceso: procesoId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Completar proceso error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al completar proceso' },
      { status: 500 },
    );
  }
}
