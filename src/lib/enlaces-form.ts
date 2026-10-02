/* ============================================================
   Valores iniciales del formulario de enlace — Portal Capacitación RR/AS400
   Módulo SIN 'use client': lo importan tanto las páginas (Server
   Components: /editor/enlaces/nuevo y /editor/enlaces/[id]/editar)
   como el propio FormularioEnlace (Client Component). Si estos
   helpers vivieran en el componente cliente, llamarlos desde el
   servidor revienta con:
     "Attempted to call inicialVacio() from the server but
      inicialVacio is on the client"
   y Next responde Application error + Digest.
   ============================================================ */

import type { Enlace } from '@/types';

export interface EnlaceFormInicial {
  categoria: string;
  grupo: string;
  nombre: string;
  url: string;
  descripcion: string;
  orden: string;
  estado: string;
}

export function inicialVacio(): EnlaceFormInicial {
  return { categoria: '', grupo: '', nombre: '', url: '', descripcion: '', orden: '0', estado: 'publicado' };
}

export function inicialDe(e: Enlace): EnlaceFormInicial {
  return {
    categoria: e.categoria,
    grupo: e.grupo,
    nombre: e.nombre,
    url: e.url ?? '',
    descripcion: e.descripcion ?? '',
    orden: String(e.orden ?? 0),
    estado: e.estado,
  };
}
