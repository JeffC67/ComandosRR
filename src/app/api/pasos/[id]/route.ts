/* ============================================================
   API: Paso por id — Portal Capacitación RR / AS400
   PATCH /api/pasos/:id, DELETE /api/pasos/:id
   Misma regla que su proceso padre.
   ============================================================ */

import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { directusGet } from '@/lib/directus-api';
import { exigirAccesoProceso } from '@/lib/procesos-write';

async function servicio(path: string, method: 'PATCH' | 'DELETE', body?: unknown) {
  const { directusUrl } = await import('@/lib/directus-url');
  const login = await fetch(`${directusUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.DIRECTUS_SERVICE_EMAIL,
      password: process.env.DIRECTUS_SERVICE_PASSWORD,
    }),
  }).then((r) => r.json());
  const token = login.data.access_token as string;
  const res = await fetch(`${directusUrl()}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok && res.status !== 204) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.errors?.[0]?.message ?? `${method} ${path} → ${res.status}`);
  }
  return res.status === 204 ? null : res.json().catch(() => null);
}

async function padreDe(pasoId: string): Promise<{ id: number; proceso: number; slug: string }> {
  const data = await directusGet<{ data: { id: number; proceso: number }[] }>(
    `/items/pasos?filter[id][_eq]=${encodeURIComponent(pasoId)}&fields=id,proceso&limit=1`,
  );
  const fila = data.data[0];
  if (!fila) throw Object.assign(new Error('Paso no encontrado'), { status: 404 });
  const proc = await directusGet<{ data: { id: number; slug: string }[] }>(
    `/items/procesos?filter[id][_eq]=${fila.proceso}&fields=id,slug&limit=1`,
  );
  return { id: fila.id, proceso: fila.proceso, slug: proc.data[0]?.slug ?? '' };
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
    const paso = await padreDe(id);
    const fila = await exigirAccesoProceso(session, paso.proceso);
    const body: Record<string, unknown> = {};
    if (input.grupo !== undefined)
      body.grupo = typeof input.grupo === 'string' && input.grupo.trim() ? input.grupo.slice(0, 255) : null;
    if (input.contenido !== undefined) {
      if (typeof input.contenido !== 'string' || !input.contenido.trim()) {
        return NextResponse.json({ error: 'contenido vacío' }, { status: 400 });
      }
      body.contenido = input.contenido;
    }
    if (input.orden !== undefined && Number.isFinite(Number(input.orden))) body.orden = Math.round(Number(input.orden));
    if (Object.keys(body).length) await servicio(`/items/pasos/${paso.id}`, 'PATCH', body);
    revalidatePath('/procesos');
    if (fila.slug) revalidatePath(`/procesos/${fila.slug}`);
    return NextResponse.json({ ok: true });
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
    const paso = await padreDe(id);
    const fila = await exigirAccesoProceso(session, paso.proceso);
    await servicio(`/items/pasos/${paso.id}`, 'DELETE');
    revalidatePath('/procesos');
    if (fila.slug) revalidatePath(`/procesos/${fila.slug}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = (e as { status?: number }).status ?? (/permiso/i.test(msg) ? 403 : 500);
    return NextResponse.json({ error: msg }, { status });
  }
}
