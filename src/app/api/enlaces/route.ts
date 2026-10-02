/* ============================================================
   API: Enlaces — Portal Capacitación RR / AS400
   POST /api/enlaces → crear (solo editor/admin, nace publicado
   salvo que se pida borrador). Revalida /aplicaciones.
   ============================================================ */

import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { directusPost } from '@/lib/directus-api';
import { exigirEditorEnlaces, normalizarEnlace } from '@/lib/enlaces-write';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  try {
    exigirEditorEnlaces(session);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  try {
    const body = normalizarEnlace(input);
    if (!body.categoria || !body.grupo || !body.nombre) {
      return NextResponse.json({ error: 'Categoría, grupo y nombre son obligatorios' }, { status: 400 });
    }
    if (body.estado === undefined) body.estado = 'publicado';
    const creado = await directusPost<{ data: { id: number } }>('/items/enlaces', body);

    revalidatePath('/aplicaciones');
    revalidatePath('/');
    return NextResponse.json({ ok: true, id: creado.data.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
