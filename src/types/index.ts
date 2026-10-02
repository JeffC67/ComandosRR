/* ============================================================
   Tipos compartidos — Portal Capacitación RR / AS400
   ============================================================ */

export interface Modulo {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string | null;
  orden: number;
  estado: 'borrador' | 'publicado';
  icono: string | null;
  /** Cómo se compone la sección en la portada */
  layout: 'video-izquierda' | 'video-derecha' | 'tarjetas-ancho' | 'procesos' | null;
  /** Encabezado sobre la rejilla de comandos (null = sin título) */
  titulo_tarjetas: string | null;
}

export interface Comando {
  id: string;
  etiqueta: string;
  tecla: string;
  tipo: 'basico' | 'avanzado';
  icono: string | null;
  orden: number;
  estado: 'borrador' | 'publicado';
  modulo: string; // slug del módulo
}

export interface Categoria {
  id: string;
  slug: string;
  nombre: string;
  /** Encabezado corto de la tarjeta en la portada */
  titulo_corto: string | null;
  descripcion: string | null;
  /** Texto largo que se muestra bajo el título en la tarjeta */
  texto_tarjeta: string | null;
  icono: string | null;
  orden: number;
  estado: 'borrador' | 'publicado';
  /** Nº de procesos publicados de la categoría (agregado en la consulta) */
  totalProcesos?: number;
  /** Tono de la tarjeta: primary | accent | success */
  tono?: 'primary' | 'accent' | 'success';
  /** Texto del enlace, p. ej. "Ver procesos" */
  etiqueta_enlace?: string | null;
}

export interface Proceso {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string;
  duracion_min: number | null;
  icono: string | null;
  codigo: string | null;
  nota: string | null;
  orden: number;
  estado: 'borrador' | 'publicado' | 'archivado';
  categoria: string | null; // slug de la categoría
  /** Agente que propuso el proceso (cola de validación). Null = contenido base. */
  creado_por?: string | { id: string; email?: string | null } | null;
}

/* Proceso + sus pasos y categoría, tal como lo consume /procesos/[slug] */
export interface ProcesoDetalle extends Proceso {
  pasos: Paso[];
}

export interface Paso {
  id: string;
  proceso: string;
  orden: number;
  grupo: string | null;
  contenido: string; // HTML
}

export interface Video {
  id: string;
  titulo: string;
  archivo: string; // nombre del mp4 en public/media (p. ej. Bunny.mp4)
  poster: string | null;
  orden: number;
  estado: 'borrador' | 'publicado';
  modulo: string; // slug del módulo
}

/* Enlace rápido de la sección Aplicaciones (catálogo PortalAppsIndra:
   INDRA/HOGAR/MÓVIL). Sin URL = se muestra sin navegar (como MAXIMO). */
export interface Enlace {
  id: string;
  categoria: string;
  grupo: string;
  nombre: string;
  url: string | null;
  descripcion: string | null;
  orden: number;
  estado: 'borrador' | 'publicado' | 'archivado';
}

export interface DirectusFile {
  id: string;
  filename_download: string;
  filename_disk: string;
  title: string | null;
  type: string;
  filesize: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  storage: string;
  tags: string[];
  metadata: Record<string, unknown> | null;
  uploaded_by: string | null;
  uploaded_on: string;
  modified_by: string | null;
  modified_on: string;
  charset: string | null;
  description: string | null;
  location: string | null;
}

/* API response helpers */
export interface DirectusResponse<T> {
  data: T;
  meta?: {
    total_count?: number;
    filter_count?: number;
  };
}

export interface DirectusListResponse<T> {
  data: T[];
  meta: {
    total_count: number;
    filter_count: number;
  };
}

/* Hero stats calculadas */
export interface HeroStats {
  totalComandos: number;
  totalVideos: number;
  totalProcesos: number;
}
