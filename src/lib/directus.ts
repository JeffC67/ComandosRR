/* ============================================================
   Cliente Directus — Portal Capacitación RR / AS400
   Configurado para SSR/ISR con token de servicio
   ============================================================ */

import { createDirectus, rest, readItems, readItem, staticToken } from '@directus/sdk';
import type {
  Modulo,
  Comando,
  Proceso,
  Paso,
  Video,
  DirectusFile,
  DirectusListResponse,
} from '@/types';

/* Cliente singleton para el servidor (SSR/ISR) */
function getDirectusClient() {
  const url = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://portal.rr.local';
  const token = process.env.DIRECTUS_TOKEN;

  const client = createDirectus(url).with(rest({ credentials: 'include' }));

  if (!token) {
    console.warn('[Directus] DIRECTUS_TOKEN no configurado — usando cliente público (solo publicado)');
    return client;
  }

  return client.with(staticToken(token));
}

/* ---------- Helpers de filtrado ---------- */
const publishedFilter = { estado: { _eq: 'publicado' as const } };
const sortByOrden = ['orden'];

/* ---------- MÓDULOS ---------- */
export async function getModulos(): Promise<Modulo[]> {
  const client = getDirectusClient();
  const data = await client.request(
    readItems('modulos', {
      filter: publishedFilter,
      sort: sortByOrden,
      fields: ['id', 'slug', 'titulo', 'descripcion', 'orden', 'estado', 'icono'],
    })
  );
  return data as Modulo[];
}

export async function getModuloBySlug(slug: string): Promise<Modulo | null> {
  const client = getDirectusClient();
  const items = await client.request(
    readItems('modulos', {
      filter: { slug: { _eq: slug }, ...publishedFilter },
      limit: 1,
      fields: ['id', 'slug', 'titulo', 'descripcion', 'orden', 'estado', 'icono'],
    })
  );
  return (items as Modulo[])[0] ?? null;
}

/* ---------- COMANDOS ---------- */
export async function getComandosByModulo(moduloSlug: string): Promise<Comando[]> {
  const client = getDirectusClient();
  const data = await client.request(
    readItems('comandos', {
      filter: { modulo: { slug: { _eq: moduloSlug } }, ...publishedFilter },
      sort: sortByOrden,
      fields: ['id', 'etiqueta', 'tecla', 'tipo', 'icono', 'orden', 'estado', 'modulo'],
    })
  );
  return data as Comando[];
}

export async function getAllComandos(): Promise<Comando[]> {
  const client = getDirectusClient();
  const data = await client.request(
    readItems('comandos', {
      filter: publishedFilter,
      sort: sortByOrden,
      fields: ['id', 'etiqueta', 'tecla', 'tipo', 'icono', 'orden', 'estado', 'modulo'],
    })
  );
  return data as Comando[];
}

/* ---------- PROCESOS ---------- */
export async function getProcesos(): Promise<Proceso[]> {
  const client = getDirectusClient();
  const data = await client.request(
    readItems('procesos', {
      filter: publishedFilter,
      sort: sortByOrden,
      fields: ['id', 'slug', 'titulo', 'descripcion', 'duracion_min', 'icono', 'orden', 'estado'],
    })
  );
  return data as Proceso[];
}

export async function getProcesoBySlug(slug: string): Promise<Proceso | null> {
  const client = getDirectusClient();
  const items = await client.request(
    readItems('procesos', {
      filter: { slug: { _eq: slug }, ...publishedFilter },
      limit: 1,
      fields: ['id', 'slug', 'titulo', 'descripcion', 'duracion_min', 'icono', 'orden', 'estado'],
    })
  );
  return (items as Proceso[])[0] ?? null;
}

export async function getPasosByProceso(procesoId: string): Promise<Paso[]> {
  const client = getDirectusClient();
  const data = await client.request(
    readItems('pasos', {
      filter: { proceso: { _eq: procesoId } },
      sort: ['orden'],
      fields: ['id', 'proceso', 'orden', 'grupo', 'contenido'],
    })
  );
  return data as Paso[];
}

/* ---------- VIDEOS ---------- */
export async function getVideosByModulo(moduloSlug: string): Promise<Video[]> {
  const client = getDirectusClient();
  const data = await client.request(
    readItems('videos', {
      filter: { modulo: { slug: { _eq: moduloSlug } }, ...publishedFilter },
      sort: sortByOrden,
      fields: ['id', 'titulo', 'archivo', 'poster', 'orden', 'estado', 'modulo'],
    })
  );
  return data as Video[];
}

export async function getAllVideos(): Promise<Video[]> {
  const client = getDirectusClient();
  const data = await client.request(
    readItems('videos', {
      filter: publishedFilter,
      sort: sortByOrden,
      fields: ['id', 'titulo', 'archivo', 'poster', 'orden', 'estado', 'modulo'],
    })
  );
  return data as Video[];
}

/* ---------- ASSETS / ARCHIVOS ---------- */
export async function getVideoFile(fileId: string): Promise<DirectusFile | null> {
  const client = getDirectusClient();
  try {
    return await client.request(readItem('files', fileId, { fields: ['*'] })) as DirectusFile;
  } catch {
    return null;
  }
}

export function getAssetUrl(fileId: string): string {
  const base = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://portal.rr.local';
  return `${base}/assets/${fileId}`;
}

export function getVideoUrl(fileId: string): string {
  return getAssetUrl(fileId);
}

export function getPosterUrl(fileId: string | null): string | null {
  if (!fileId) return null;
  return getAssetUrl(fileId);
}

/* ---------- STATS PARA HERO ---------- */
export async function getHeroStats() {
  const [comandos, videos, procesos] = await Promise.all([
    getAllComandos(),
    getAllVideos(),
    getProcesos(),
  ]);
  return {
    totalComandos: comandos.length,
    totalVideos: videos.length,
    totalProcesos: procesos.length,
  };
}