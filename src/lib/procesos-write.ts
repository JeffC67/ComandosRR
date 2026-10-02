/* ============================================================
   Procesos — escritura mediada por el servidor
   El aislamiento por rol vive aquí, no en Directus (las reglas
   condicionales son de pago en la edición gratuita).

   · agente: propone (crea borrador), edita/elimina SOLO sus
     borradores (creado_por = session.sub). Nunca publica.
   · editor/admin: CRUD total + validar (borrador → publicado).
   · Antes de validar no se publica: el portal público solo lee
     estado=publicado (src/lib/directus.ts).
   ============================================================ */

import { directusGet, directusPost, idRelacion } from '@/lib/directus-api';
import type { JWTPayload } from '@/types/auth';
import { puedeEditarProcesos } from '@/lib/roles';

export interface PasoInput {
  grupo?: string | null;
  contenido: string;
  orden?: number;
}

export interface ProcesoInput {
  titulo: string;
  descripcion?: string | null;
  slug?: string;
  categoria?: number | null;
  duracion_min?: number | null;
  icono?: string | null;
  codigo?: string | null;
  nota?: string | null;
  orden?: number;
  estado?: string;
  pasos?: PasoInput[];
}

interface ProcesoFila {
  id: number;
  estado: string;
  slug: string;
  creado_por?: unknown;
}

export function slugify(titulo: string): string {
  const base = titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return base || `proceso-${Date.now()}`;
}

async function leerProceso(id: string | number): Promise<ProcesoFila> {
  const data = await directusGet<{ data: ProcesoFila[] }>(
    `/items/procesos?filter[id][_eq]=${encodeURIComponent(String(id))}&fields=id,estado,slug,creado_por&limit=1`,
  );
  const fila = data.data[0];
  if (!fila) throw Object.assign(new Error('Proceso no encontrado'), { status: 404 });
  return fila;
}

/* ¿Puede este usuario tocar este proceso? Devuelve la fila para reusarla. */
export async function exigirAccesoProceso(session: JWTPayload, id: string | number): Promise<ProcesoFila> {
  const fila = await leerProceso(id);
  if (puedeEditarProcesos(session.role as 'editor' | 'admin' | 'agente')) {
    const r = session.role as string;
    if (r === 'editor' || r === 'admin') return fila;
  }
  // agente: solo sus borradores
  const creador = idRelacion((fila as { creado_por?: unknown }).creado_por);
  if (fila.estado !== 'borrador' || !creador || creador !== session.sub) {
    throw Object.assign(new Error('No tienes permiso sobre este proceso'), { status: 403 });
  }
  return fila;
}

export function exigirEditor(session: JWTPayload): void {
  if (session.role !== 'editor' && session.role !== 'admin') {
    throw Object.assign(new Error('Solo editor o admin'), { status: 403 });
  }
}

/* Normaliza el cuerpo de crear/editar. El agente siempre queda en
   borrador aunque mande otro estado. */
export function normalizarProceso(input: ProcesoInput, rol: string, esCreacion: boolean) {
  const body: Record<string, unknown> = {};
  if (input.titulo !== undefined) body.titulo = String(input.titulo).slice(0, 255);
  if (input.descripcion !== undefined) body.descripcion = input.descripcion || null;
  if (input.slug !== undefined && String(input.slug).trim()) {
    body.slug = String(input.slug)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64);
  } else if (esCreacion && input.titulo) {
    body.slug = slugify(input.titulo);
  }
  if (input.categoria !== undefined) body.categoria = input.categoria || null;
  if (input.duracion_min !== undefined) {
    const n = Number(input.duracion_min);
    body.duracion_min = Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  }
  if (input.icono !== undefined) body.icono = input.icono || null;
  if (input.codigo !== undefined) body.codigo = input.codigo || null;
  if (input.nota !== undefined) body.nota = input.nota || null;
  if (input.orden !== undefined) {
    const n = Number(input.orden);
    body.orden = Number.isFinite(n) ? Math.round(n) : 0;
  }
  if (rol === 'editor' || rol === 'admin') {
    if (input.estado === 'publicado' || input.estado === 'borrador' || input.estado === 'archivado') {
      body.estado = input.estado;
    } else if (esCreacion) {
      body.estado = 'borrador';
    }
  } else {
    // agente: propuesta siempre en borrador (pendiente de validación)
    body.estado = 'borrador';
  }
  return body;
}

export function normalizarPasos(pasos: PasoInput[] | undefined): PasoInput[] {
  if (!Array.isArray(pasos)) return [];
  return pasos
    .filter((p) => p && typeof p.contenido === 'string' && p.contenido.trim())
    .slice(0, 100)
    .map((p, i) => ({
      grupo: p.grupo?.toString().slice(0, 255) || null,
      contenido: p.contenido,
      orden: Number.isFinite(Number(p.orden)) ? Math.round(Number(p.orden)) : i + 1,
    }));
}

export { leerProceso };
export { directusGet, directusPost };
