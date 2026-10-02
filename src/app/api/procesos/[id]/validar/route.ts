/* ============================================================
   API: Validar proceso — Portal Capacitación RR / AS400
   POST /api/procesos/:id/validar → borrador → publicado
   Solo editor/admin. Es el acto de publicar tras validar: antes
   de esto el proceso no aparece en el portal (solo publicado).
   ============================================================ */

import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { exigirEditor, leerProceso } from '@/lib/procesos-write';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  try {
    exigirEditor(session);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 403 });
  }
  const { id } = await params;

  try {
    const fila = await leerProceso(id);
    if (fila.estado === 'publicado') return NextResponse.json({ ok: true, yaEstaba: true });

    const { directusUrl } = await import('@/lib/directus-url');
    const email = process.env.DIRECTUS_SERVICE_EMAIL;
    const password = process.env.DIRECTUS_SERVICE_PASSWORD;
    const login = await fetch(`${directusUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then((r) => r.json());
    const token = login.data.access_token as string;
    const res = await fetch(`${directusUrl()}/items/procesos/${fila.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'publicado' }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      throw new Error(j?.errors?.[0]?.message ?? `PATCH → ${res.status}`);
    }

    revalidatePath('/procesos');
    revalidatePath(`/procesos/${fila.slug}`);
    revalidatePath('/');
    return NextResponse.json({ ok: true, id: fila.id, slug: fila.slug });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
