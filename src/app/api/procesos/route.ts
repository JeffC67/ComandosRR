/* ============================================================
   API: Crear proceso — Portal Capacitación RR / AS400
   POST /api/procesos
   · agente: propone en borrador (pendiente de validación).
   · editor/admin: crean (borrador por defecto, pueden publicar).
   ============================================================ */

import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { directusPost } from '@/lib/directus-api';
import { normalizarProceso, normalizarPasos } from '@/lib/procesos-write';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const titulo = typeof input.titulo === 'string' ? input.titulo.trim() : '';
  if (!titulo) return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 });

  const body = normalizarProceso(input as never, session.role, true);
  body.creado_por = session.sub;
  const pasos = normalizarPasos(input.pasos as never);

  try {
    const creado = await directusPost<{ data: { id: number; slug: string } }>('/items/procesos', body);
    const procesoId = creado.data.id;

    for (const p of pasos) {
      await directusPost('/items/pasos', { ...p, proceso: procesoId });
    }

    // Si un editor publica al crear, el listado se refresca
    if (body.estado === 'publicado') {
      revalidatePath('/procesos');
      revalidatePath('/');
    }

    return NextResponse.json(
      {
        ok: true,
        id: procesoId,
        slug: creado.data.slug,
        estado: body.estado,
        pendiente: body.estado !== 'publicado',
      },
      { status: 201 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = /ya existe|duplicad|unique/i.test(msg) ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
