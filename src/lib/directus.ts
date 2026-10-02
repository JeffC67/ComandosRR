/* ============================================================
   Cliente Directus — Portal Capacitación RR / AS400
   SSR/ISR con una cuenta de servicio de solo lectura.

   Directus 12 eliminó los tokens estáticos, así que no existe una
   clave fija que pegar en el entorno: el servidor inicia sesión con
   DIRECTUS_SERVICE_EMAIL/PASSWORD y el SDK renueva la sesión sola
   (ACCESS_TOKEN_TTL=1d en docker-compose).
   ============================================================ */

import { createDirectus, rest, readItems, authentication } from '@directus/sdk';
import { directusUrl } from '@/lib/directus-url';
import type { Modulo, Comando, Categoria, Proceso, Paso, Video, Enlace } from '@/types';

function crearCliente(url: string) {
  return createDirectus(url).with(rest());
}

type Cliente = ReturnType<typeof crearCliente>;

/* Singleton con login perezoso: el cliente debe sobrevivir entre
   peticiones para que el refresco automático de la sesión funcione. */
let cliente: Cliente | null = null;
let loginEnCurso: Promise<Cliente> | null = null;
let avisado = false;

function getDirectusClient(): Promise<Cliente> | Cliente {
  if (cliente) return cliente;

  const url = directusUrl();
  const email = process.env.DIRECTUS_SERVICE_EMAIL;
  const password = process.env.DIRECTUS_SERVICE_PASSWORD;

  if (!email || !password) {
    /* Sin cuenta de servicio caemos al cliente público, que solo puede
       leer los assets: las páginas de contenido devolverán 403. */
    if (!avisado) {
      avisado = true;
      console.warn(
        '[Directus] DIRECTUS_SERVICE_EMAIL/PASSWORD no configurados — solo se podrán leer los assets. ' +
          'Ejecuta `npm run setup:access` y copia la contraseña a .env.local',
      );
    }
    return crearCliente(url);
  }

  /* Si llegan varias peticiones a la vez, solo se inicia una sesión. */
  if (!loginEnCurso) {
    const sesion = crearCliente(url).with(
      authentication('json', { autoRefresh: true, msRefreshBeforeExpires: 60_000 }),
    );

    loginEnCurso = sesion
      .login(email, password, { mode: 'json' })
      .then(() => {
        cliente = sesion;
        return sesion;
      })
      .catch((err: Error) => {
        loginEnCurso = null; // permite reintentar en la siguiente petición
        throw new Error(
          `[Directus] No se pudo iniciar sesión con la cuenta de servicio (${email}): ${err.message}. ` +
            'Revisa DIRECTUS_SERVICE_PASSWORD en .env.local y ejecuta `npm run setup:access` para resetearla.',
        );
      });
  }

  return loginEnCurso;
}

/* ---------- Helpers de filtrado ---------- */
const publishedFilter = { estado: { _eq: 'publicado' as const } };
const sortByOrden = ['orden'];

/* ---------- MÓDULOS ---------- */
export async function getModulos(): Promise<Modulo[]> {
  const client = await getDirectusClient();
  const data = await client.request(
    readItems('modulos', {
      filter: publishedFilter,
      sort: sortByOrden,
      fields: ['id', 'slug', 'titulo', 'descripcion', 'orden', 'estado', 'icono', 'layout', 'titulo_tarjetas'],
    }),
  );
  return data as Modulo[];
}

export async function getModuloBySlug(slug: string): Promise<Modulo | null> {
  const client = await getDirectusClient();
  const items = await client.request(
    readItems('modulos', {
      filter: { slug: { _eq: slug }, ...publishedFilter },
      limit: 1,
      fields: ['id', 'slug', 'titulo', 'descripcion', 'orden', 'estado', 'icono', 'layout', 'titulo_tarjetas'],
    }),
  );
  return (items as Modulo[])[0] ?? null;
}

/* ---------- COMANDOS ---------- */
export async function getComandosByModulo(moduloSlug: string): Promise<Comando[]> {
  const client = await getDirectusClient();
  const data = await client.request(
    readItems('comandos', {
      filter: { modulo: { slug: { _eq: moduloSlug } }, ...publishedFilter },
      sort: sortByOrden,
      fields: ['id', 'etiqueta', 'tecla', 'tipo', 'icono', 'orden', 'estado', 'modulo'],
    }),
  );
  return data as Comando[];
}

export async function getAllComandos(): Promise<Comando[]> {
  const client = await getDirectusClient();
  const data = await client.request(
    readItems('comandos', {
      filter: publishedFilter,
      sort: sortByOrden,
      fields: ['id', 'etiqueta', 'tecla', 'tipo', 'icono', 'orden', 'estado', 'modulo'],
    }),
  );
  return data as Comando[];
}

/* ---------- PROCESOS ---------- */

const PROCESO_FIELDS = [
  'id',
  'slug',
  'titulo',
  'descripcion',
  'duracion_min',
  'icono',
  'codigo',
  'nota',
  'orden',
  'estado',
  'categoria.slug',
  'creado_por.id',
  'creado_por.email',
];

/* Directus devuelve categoria como { slug }, pero el resto del portal
   trabaja con el slug plano. `id` se pasa a texto: Proceso.id está
   declarado como string y crudo vendría como número de Postgres. */
type ProcesoRaw = Omit<Proceso, 'categoria' | 'creado_por'> & {
  id: number | string;
  categoria: { slug: string } | string | null;
  creado_por: { id: string; email?: string | null } | string | null;
};

const toProceso = (p: ProcesoRaw): Proceso => ({
  ...p,
  id: String(p.id),
  categoria: typeof p.categoria === 'string' ? p.categoria : (p.categoria?.slug ?? null),
  creado_por:
    typeof p.creado_por === 'string'
      ? p.creado_por
      : p.creado_por
        ? { id: String(p.creado_por.id), email: p.creado_por.email ?? null }
        : null,
});

export function idCreador(proceso: Pick<Proceso, 'creado_por'>): string | null {
  const c = proceso.creado_por;
  if (!c) return null;
  return typeof c === 'string' ? c : String(c.id);
}

export async function getProcesos(): Promise<Proceso[]> {
  const client = await getDirectusClient();
  const data = await client.request(
    readItems('procesos', {
      filter: publishedFilter,
      sort: sortByOrden,
      fields: PROCESO_FIELDS,
    }),
  );
  return (data as ProcesoRaw[]).map(toProceso);
}

/* Igual que getProcesos pero limitado a una categoría (por slug) */
export async function getProcesosByCategoria(categoriaSlug: string): Promise<Proceso[]> {
  const client = await getDirectusClient();
  const data = await client.request(
    readItems('procesos', {
      filter: { categoria: { slug: { _eq: categoriaSlug } }, ...publishedFilter },
      sort: sortByOrden,
      fields: PROCESO_FIELDS,
    }),
  );
  return (data as ProcesoRaw[]).map(toProceso);
}

export async function getProcesoBySlug(slug: string): Promise<Proceso | null> {
  const client = await getDirectusClient();
  const items = await client.request(
    readItems('procesos', {
      filter: { slug: { _eq: slug }, ...publishedFilter },
      limit: 1,
      fields: PROCESO_FIELDS,
    }),
  );
  return items.length ? toProceso(items[0] as ProcesoRaw) : null;
}

/* ---------- COLA DE VALIDACIÓN (editor/admin) ----------
   Borradores pendientes: lo que propusieron los agentes y aún no
   se publica. Solo la usa el servidor (cuenta Portal): el portal
   público filtra "solo publicado" y nunca los muestra. */
export async function getProcesosPendientes(): Promise<Proceso[]> {
  const client = await getDirectusClient();
  const data = await client.request(
    readItems('procesos', {
      filter: { estado: { _eq: 'borrador' as const } },
      sort: sortByOrden,
      fields: PROCESO_FIELDS,
    }),
  );
  return (data as ProcesoRaw[]).map(toProceso);
}

/* Un proceso cualquiera por id, sin filtrar estado: para editar y
   validar. El control de quién puede verlo vive en la ruta que lo
   llama, no aquí. */
export async function getProcesoByIdSinFiltro(id: string | number): Promise<Proceso | null> {
  const client = await getDirectusClient();
  const items = await client.request(
    readItems('procesos', {
      filter: { id: { _eq: id } },
      limit: 1,
      fields: PROCESO_FIELDS,
    }),
  );
  return items.length ? toProceso(items[0] as ProcesoRaw) : null;
}

/* Nº de pasos por proceso, indexado por el slug del proceso, para el
   "🔄 4 pasos" de la tarjeta. Se cuenta leyendo `pasos` y agrupando en
   memoria en vez de guardar un campo `total_pasos` en `procesos`: así el
   número no puede desincronizarse de los pasos reales si un editor los
   reordena o elimina desde el panel. Una sola consulta para todos. */
export async function getPasosPorProcesoSlug(): Promise<Record<string, number>> {
  const client = await getDirectusClient();
  const filas = await client.request(
    readItems('pasos', {
      fields: ['proceso.slug'],
      limit: -1,
    }),
  );

  const conteo: Record<string, number> = {};
  for (const p of filas as { proceso?: { slug: string } | null }[]) {
    const slug = p.proceso?.slug;
    if (!slug) continue;
    conteo[slug] = (conteo[slug] ?? 0) + 1;
  }
  return conteo;
}

export async function getPasosByProceso(procesoId: string): Promise<Paso[]> {
  const client = await getDirectusClient();
  const data = await client.request(
    readItems('pasos', {
      filter: { proceso: { _eq: procesoId } },
      sort: ['orden'],
      fields: ['id', 'proceso', 'orden', 'grupo', 'contenido'],
    }),
  );
  return data as Paso[];
}

/* ---------- CATEGORÍAS DE PROCESOS ---------- */
const CATEGORIA_FIELDS = [
  'id',
  'slug',
  'nombre',
  'titulo_corto',
  'descripcion',
  'texto_tarjeta',
  'icono',
  'orden',
  'estado',
  'tono',
  'etiqueta_enlace',
];

/* Cuenta de procesos publicados por categoría, para el "8 procesos" de la
   tarjeta y el contador de las pills.

   Se hace con una consulta plana y se cuenta en memoria, no con un
   `_count` anidado: el SDK 18 no construye un agregado relacional con
   `filter` dentro (lanza "f[a] is not iterable") y Directus tampoco
   acepta el filtro anidado en un count. Una sola consulta con el slug de
   la categoría es lo bastante barata (son ~12 procesos) y evita una
   consulta por categoría. */
async function countProcesosPorCategoria(): Promise<Map<string, number>> {
  const client = await getDirectusClient();
  const filas = await client.request(
    readItems('procesos', {
      filter: publishedFilter,
      // Ojo: `categoria` a secas devuelve el id de la categoría, no el
      // slug, así que el conteo por slug salía siempre a cero. Hay que
      // pedir el anidado.
      fields: ['categoria.slug'],
      limit: -1,
    }),
  );

  const conteo = new Map<string, number>();
  for (const p of filas as { categoria?: { slug: string } | null }[]) {
    const slug = p.categoria?.slug;
    if (!slug) continue;
    conteo.set(slug, (conteo.get(slug) ?? 0) + 1);
  }
  return conteo;
}

export async function getCategorias(): Promise<Categoria[]> {
  const client = await getDirectusClient();
  const [data, conteo] = await Promise.all([
    client.request(
      readItems('categorias', {
        filter: publishedFilter,
        sort: sortByOrden,
        fields: CATEGORIA_FIELDS,
      }),
    ),
    countProcesosPorCategoria(),
  ]);

  return (data as Categoria[]).map((c) => ({ ...c, totalProcesos: conteo.get(c.slug) ?? 0 }));
}

export async function getCategoriaBySlug(slug: string): Promise<Categoria | null> {
  const client = await getDirectusClient();
  const [items, conteo] = await Promise.all([
    client.request(
      readItems('categorias', {
        filter: { slug: { _eq: slug }, ...publishedFilter },
        limit: 1,
        fields: CATEGORIA_FIELDS,
      }),
    ),
    countProcesosPorCategoria(),
  ]);

  const c = (items as Categoria[])[0];
  return c ? { ...c, totalProcesos: conteo.get(c.slug) ?? 0 } : null;
}

/* ---------- VIDEOS ---------- */
export async function getVideosByModulo(moduloSlug: string): Promise<Video[]> {
  const client = await getDirectusClient();
  const data = await client.request(
    readItems('videos', {
      filter: { modulo: { slug: { _eq: moduloSlug } }, ...publishedFilter },
      sort: sortByOrden,
      fields: ['id', 'titulo', 'archivo', 'poster', 'orden', 'estado', 'modulo'],
    }),
  );
  return data as Video[];
}

export async function getAllVideos(): Promise<Video[]> {
  const client = await getDirectusClient();
  const data = await client.request(
    readItems('videos', {
      filter: publishedFilter,
      sort: sortByOrden,
      fields: ['id', 'titulo', 'archivo', 'poster', 'orden', 'estado', 'modulo'],
    }),
  );
  return data as Video[];
}

/* ---------- ENLACES (sección Aplicaciones) ----------
   Catálogo de enlaces rápidos (PortalAppsIndra: INDRA/HOGAR/MÓVIL).
   El portal solo muestra estado=publicado, ordenados por
   categoría → grupo → orden. Sin URL = se muestra sin navegar. */
export interface GrupoEnlaces {
  categoria: string;
  grupo: string;
  enlaces: Enlace[];
}

export async function getEnlacesPublicados(): Promise<GrupoEnlaces[]> {
  const client = await getDirectusClient();
  const data = (await client.request(
    readItems('enlaces', {
      filter: publishedFilter,
      sort: ['categoria', 'grupo', 'orden'],
      fields: ['id', 'categoria', 'grupo', 'nombre', 'url', 'descripcion', 'orden', 'estado'],
      limit: -1,
    }),
  )) as Enlace[];

  const grupos: GrupoEnlaces[] = [];
  for (const e of data) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.categoria === e.categoria && ultimo.grupo === e.grupo) {
      ultimo.enlaces.push(e);
    } else {
      grupos.push({ categoria: e.categoria, grupo: e.grupo, enlaces: [e] });
    }
  }
  return grupos;
}

/* Listado completo para el editor (sin filtro de estado: también
   borradores y archivados). */
export async function getTodosLosEnlaces(): Promise<Enlace[]> {
  const client = await getDirectusClient();
  const data = (await client.request(
    readItems('enlaces', {
      sort: ['categoria', 'grupo', 'orden'],
      fields: ['id', 'categoria', 'grupo', 'nombre', 'url', 'descripcion', 'orden', 'estado'],
      limit: -1,
    }),
  )) as Enlace[];
  return data;
}

/* Un enlace por id (formulario de edición). Sin filtro de estado: el
   editor también corrige borradores. */
export async function getEnlace(id: string | number): Promise<Enlace | null> {
  const client = await getDirectusClient();
  const data = (await client.request(
    readItems('enlaces', {
      filter: { id: { _eq: Number(id) } },
      fields: ['id', 'categoria', 'grupo', 'nombre', 'url', 'descripcion', 'orden', 'estado'],
      limit: 1,
    }),
  )) as Enlace[];
  return data[0] ?? null;
}

/* ---------- ASSETS / VIDEOS ----------
   Los mp4 viven en public/media del frontend y los sirve el CDN con
   Range nativo: `videos.archivo` es el NOMBRE del archivo
   (p. ej. "Bunny.mp4"), no un file-id de Directus. No se sube nada a
   directus_files: en Render free el disco es efímero y las subidas se
   evaporarían en cada reinicio. */
export function getAssetUrl(archivo: string): string {
  const nombre =
    String(archivo || '')
      .split('/')
      .pop() || '';
  if (!nombre || nombre === '.' || nombre === '..') return '';
  return `/media/${encodeURIComponent(nombre)}`;
}

export function getVideoUrl(archivo: string): string {
  return getAssetUrl(archivo);
}

export function getPosterUrl(poster: string | null): string | null {
  if (!poster) return null;
  return getAssetUrl(poster);
}

/* ---------- STATS PARA HERO ---------- */
export async function getHeroStats() {
  const [comandos, videos, procesos] = await Promise.all([getAllComandos(), getAllVideos(), getProcesos()]);
  return {
    totalComandos: comandos.length,
    totalVideos: videos.length,
    totalProcesos: procesos.length,
  };
}
