/* ============================================================
   API: Enlace por id — Portal Capacitación RR / AS400
   PATCH /api/enlaces/:id  → corregir (solo editor/admin)
   DELETE /api/enlaces/:id → eliminar (solo editor/admin)
   Revalidan /aplicaciones.
   ============================================================ */

import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { exigirEditorEnlaces, leerEnlace, normalizarEnlace } from '@/lib/enlaces-write';

async function conServicio(path: string, method: 'PATCH' | 'DELETE', body?: unknown) {
  const { directusUrl } = await import('@/lib/directus-url');
  const email = process.env.DIRECTUS_SERVICE_EMAIL;
  const password = process.env.DIRECTUS_SERVICE_PASSWORD;
  const login = await fetch(`${directusUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then((r) => r.json());
  const token = login.data.access_token as string;
  const res = await fetch(`${directusUrl()}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok && res.status !== 204) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.errors?.[0]?.message ?? `${method} ${path} → ${res.status}`);
  }
  return res.status === 204 ? null : await res.json().catch(() => null);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  try {
    exigirEditorEnlaces(session);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 403 });
  }
  const { id } = await params;

  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  try {
    const fila = await leerEnlace(id);
    const body = normalizarEnlace(input);
    if (Object.keys(body).length > 0) {
      await conServicio(`/items/enlaces/${fila.id}`, 'PATCH', body);
    }

    revalidatePath('/aplicaciones');
    revalidatePath('/');
    return NextResponse.json({ ok: true, id: fila.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  try {
    exigirEditorEnlaces(session);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 403 });
  }
  const { id } = await params;

  try {
    const fila = await leerEnlace(id);
    await conServicio(`/items/enlaces/${fila.id}`, 'DELETE');

    revalidatePath('/aplicaciones');
    revalidatePath('/');
    return NextResponse.json({ ok: true, id: fila.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
