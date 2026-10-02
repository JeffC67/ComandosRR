/* ============================================================
   API: Pasos — Portal Capacitación RR / AS400
   POST /api/pasos → añade un paso (misma regla que editar su proceso)
   ============================================================ */

import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { directusPost } from '@/lib/directus-api';
import { exigirAccesoProceso } from '@/lib/procesos-write';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  let input: { proceso?: unknown; grupo?: unknown; contenido?: unknown; orden?: unknown };
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const procesoId = String(input.proceso ?? '');
  const contenido = typeof input.contenido === 'string' ? input.contenido.trim() : '';
  if (!procesoId) return NextResponse.json({ error: 'proceso requerido' }, { status: 400 });
  if (!contenido) return NextResponse.json({ error: 'contenido requerido' }, { status: 400 });

  try {
    const fila = await exigirAccesoProceso(session, procesoId);
    const creado = await directusPost<{ data: { id: number } }>('/items/pasos', {
      proceso: fila.id,
      grupo: typeof input.grupo === 'string' && input.grupo.trim() ? input.grupo.slice(0, 255) : null,
      contenido,
      orden: Number.isFinite(Number(input.orden)) ? Math.round(Number(input.orden)) : 0,
    });
    revalidatePath('/procesos');
    revalidatePath(`/procesos/${fila.slug}`);
    return NextResponse.json({ ok: true, id: creado.data.id }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = (e as { status?: number }).status ?? (/permiso/i.test(msg) ? 403 : 500);
    return NextResponse.json({ error: msg }, { status });
  }
}
