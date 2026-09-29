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
  icono: string;
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

export interface Proceso {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string;
  duracion_min: number | null;
  icono: string | null;
  orden: number;
  estado: 'borrador' | 'publicado';
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
  archivo: string; // Directus file ID
  poster: string | null;
  orden: number;
  estado: 'borrador' | 'publicado';
  modulo: string; // slug del módulo
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