/* ============================================================
   API: Proceso por id — Portal Capacitación RR / AS400
   PATCH /api/procesos/:id  → corregir (editor/admin: cualquiera;
     agente: solo sus borradores, sin publicar)
   DELETE /api/procesos/:id → eliminar (misma regla)
   ============================================================ */

import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { directusGet, directusPost } from '@/lib/directus-api';
import { exigirAccesoProceso, normalizarProceso, normalizarPasos } from '@/lib/procesos-write';

async function patchDirectus(path: string, body: unknown) {
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
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.errors?.[0]?.message ?? `PATCH ${path} → ${res.status}`);
  }
  return res.json();
}

async function deleteDirectus(path: string) {
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
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 204) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.errors?.[0]?.message ?? `DELETE ${path} → ${res.status}`);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const { id } = await params;

  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  try {
    const fila = await exigirAccesoProceso(session, id);
    const body = normalizarProceso(input as never, session.role, false);
    // Nunca se reasigna el autor al corregir
    delete (body as Record<string, unknown>).creado_por;

    if (Object.keys(body).length > 0) {
      await patchDirectus(`/items/procesos/${fila.id}`, body);
    }

    // Pasos: si vienen, se reemplazan (borrar + crear en orden)
    if (Array.isArray(input.pasos)) {
      const pasos = normalizarPasos(input.pasos as never);
      const actuales = await directusGet<{ data: { id: number }[] }>(
        `/items/pasos?filter[proceso][_eq]=${fila.id}&fields=id&limit=-1`,
      );
      for (const p of actuales.data) await deleteDirectus(`/items/pasos/${p.id}`);
      for (const p of pasos) await directusPost('/items/pasos', { ...p, proceso: fila.id });
    }

    revalidatePath('/procesos');
    revalidatePath(`/procesos/${fila.slug}`);
    revalidatePath('/');
    return NextResponse.json({ ok: true, id: fila.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = (e as { status?: number }).status ?? (/permiso/i.test(msg) ? 403 : 500);
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const { id } = await params;

  try {
    const fila = await exigirAccesoProceso(session, id);
    const actuales = await directusGet<{ data: { id: number }[] }>(
      `/items/pasos?filter[proceso][_eq]=${fila.id}&fields=id&limit=-1`,
    );
    for (const p of actuales.data) await deleteDirectus(`/items/pasos/${p.id}`);
    await deleteDirectus(`/items/procesos/${fila.id}`);

    revalidatePath('/procesos');
    revalidatePath('/');
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = (e as { status?: number }).status ?? (/permiso/i.test(msg) ? 403 : 500);
    return NextResponse.json({ error: msg }, { status });
  }
}
