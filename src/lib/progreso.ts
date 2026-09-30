/* ============================================================
   Progreso — Portal Capacitación RR / AS400
   Lecturas de la fase 3 (progreso y evaluaciones).

   Van con la CUENTA DE SERVICIO, no con el token de la cookie: la
   cookie guarda un JWT nuestro (src/app/api/auth/login), que Directus
   rechaza con 401 porque no es suyo. Usarlo además ponía a refrescar la
   sesión y a escribir cookies desde un Server Component, que es un
   error de Next.js — /mi-progreso caía con 500.

   El aislamiento por agente lo hace esta librería: filtra por
   `session.sub`, que es el id real del usuario en Directus. No puede
   ser en Directus con reglas de permiso condicionales porque esas son
   de pago (ver scripts/setup-phase3.mjs).
   ============================================================ */

import { directusGet } from '@/lib/directus-api';

export interface ProgresoRow {
  id: string | number;
  /* `proceso` a secas viene como número (procesos.id es integer); con
     la relación anidada, como objeto. */
  proceso?: number | string | { id: number | string; titulo?: string } | null;
  completado_en: string | null;
  porcentaje?: number | null;
}

export interface ResumenQuiz {
  intentos: number;
  promedio: number | null;
  /** mejor nota por id de proceso */
  porProceso: Map<string, number>;
}

/* Si la colección no existe todavía (fase 3 sin instalar), la página
   se muestra vacía en vez de reventar con un 500. Directus responde
   403 con "no existe o no tienes permiso" cuando falta la colección,
   así que se reconoce por el código de estado que incluye directusGet. */
function sinColeccion(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /InvalidPayload|FORBIDDEN|You don't have permission|required field|→ 40[34]:/i.test(msg);
}

export async function getProgresoUsuario(agenteId: string): Promise<ProgresoRow[]> {
  try {
    const data = await directusGet<{ data: ProgresoRow[] }>(
      `/items/progreso?filter[agente][_eq]=${encodeURIComponent(agenteId)}` +
        `&fields=id,proceso.id,proceso.titulo,completado_en,porcentaje&sort=-completado_en`,
    );
    return data.data ?? [];
  } catch (e) {
    if (sinColeccion(e)) return [];
    throw e;
  }
}

export async function getPromediosQuiz(agenteId: string): Promise<ResumenQuiz> {
  try {
    const data = await directusGet<{
      data: { id: string; puntaje: number; proceso?: string | null }[];
    }>(
      `/items/quiz_intentos?filter[agente][_eq]=${encodeURIComponent(agenteId)}` +
        `&fields=id,puntaje,proceso&limit=-1`,
    );

    const intentos = data.data ?? [];
    const porProceso = new Map<string, number>();

    let suma = 0;
    for (const i of intentos) {
      suma += Number(i.puntaje) || 0;
      /* El id de proceso vuelve como número (procesos.id es integer);
         String() es lo que hace que la clave del mapa coincida. */
      const pid = i.proceso != null ? String(i.proceso) : null;
      if (pid && (!porProceso.has(pid) || porProceso.get(pid)! < i.puntaje)) {
        porProceso.set(pid, i.puntaje);
      }
    }

    return {
      intentos: intentos.length,
      promedio: intentos.length ? Math.round(suma / intentos.length) : null,
      porProceso,
    };
  } catch (e) {
    if (sinColeccion(e)) return { intentos: 0, promedio: null, porProceso: new Map() };
    throw e;
  }
}
