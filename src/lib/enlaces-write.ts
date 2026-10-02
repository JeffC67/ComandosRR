/* ============================================================
   Enlaces — escritura mediada por el servidor
   Sección Aplicaciones (catálogo PortalAppsIndra).
   Mismo criterio que procesos (ver procesos-write.ts): el
   aislamiento por rol vive aquí, no en Directus.
   · editor/admin: CRUD total.
   · agente: sin escritura (solo ve publicados en /aplicaciones).
   ============================================================ */

import { directusGet, directusPost } from '@/lib/directus-api';
import type { JWTPayload } from '@/types/auth';
import { puedeEditarEnlaces } from '@/lib/roles';

export interface EnlaceInput {
  categoria?: unknown;
  grupo?: unknown;
  nombre?: unknown;
  url?: unknown;
  descripcion?: unknown;
  orden?: unknown;
  estado?: unknown;
}

interface EnlaceFila {
  id: number;
  nombre: string;
  estado: string;
}

export function exigirEditorEnlaces(session: JWTPayload): void {
  if (!puedeEditarEnlaces(session.role as 'agente' | 'editor' | 'admin')) {
    throw Object.assign(new Error('Solo editor o admin'), { status: 403 });
  }
}

export async function leerEnlace(id: string | number): Promise<EnlaceFila> {
  const data = await directusGet<{ data: EnlaceFila[] }>(
    `/items/enlaces?filter[id][_eq]=${encodeURIComponent(String(id))}&fields=id,nombre,estado&limit=1`,
  );
  const fila = data.data[0];
  if (!fila) throw Object.assign(new Error('Enlace no encontrado'), { status: 404 });
  return fila;
}

/* Normaliza crear/editar. La URL puede quedar vacía (se muestra sin
   navegar, como MAXIMO); el resto se recorta a su longitud. */
export function normalizarEnlace(input: EnlaceInput) {
  const body: Record<string, unknown> = {};
  if (input.categoria !== undefined) {
    const v = String(input.categoria).trim().toUpperCase().slice(0, 60);
    if (!v) throw Object.assign(new Error('La categoría es obligatoria'), { status: 400 });
    body.categoria = v;
  }
  if (input.grupo !== undefined) {
    const v = String(input.grupo).trim().toUpperCase().slice(0, 120);
    if (!v) throw Object.assign(new Error('El grupo es obligatorio'), { status: 400 });
    body.grupo = v;
  }
  if (input.nombre !== undefined) {
    const v = String(input.nombre).trim().slice(0, 120);
    if (!v) throw Object.assign(new Error('El nombre es obligatorio'), { status: 400 });
    body.nombre = v;
  }
  if (input.url !== undefined) {
    const v = String(input.url).trim().slice(0, 1024) || null;
    if (v && !/^https?:\/\/\S+$/i.test(v)) {
      throw Object.assign(new Error('La URL debe empezar con http:// o https://'), { status: 400 });
    }
    body.url = v;
  }
  if (input.descripcion !== undefined) {
    body.descripcion = String(input.descripcion).trim() || null;
  }
  if (input.orden !== undefined) {
    const n = Number(input.orden);
    body.orden = Number.isFinite(n) ? Math.trunc(n) : 0;
  }
  if (input.estado !== undefined) {
    const v = String(input.estado);
    if (!['publicado', 'borrador', 'archivado'].includes(v)) {
      throw Object.assign(new Error('Estado inválido'), { status: 400 });
    }
    body.estado = v;
  }
  return body;
}

export { directusGet, directusPost };
