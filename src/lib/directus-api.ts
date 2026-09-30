/* ============================================================
   Directus REST con la cuenta de servicio — Portal Capacitación RR / AS400
   Para las rutas de API que necesitan CRUD. No hay token estático:
   el servidor inicia sesión con DIRECTUS_SERVICE_EMAIL/PASSWORD y
   reutiliza la misma sesión que src/lib/directus.ts.

   El rol Portal tiene lectura sobre el contenido publicado y escritura
   solo en progreso / quiz_intentos, que son datos del agente.
   ============================================================ */

import { createDirectus, rest, authentication } from '@directus/sdk';
import { directusUrl } from '@/lib/directus-url';

const URL_BASE = directusUrl();

/* Una sola sesión por proceso, como en src/lib/directus.ts */
let tokenPromise: Promise<string> | null = null;

async function getToken(): Promise<string> {
  if (!tokenPromise) {
    const email = process.env.DIRECTUS_SERVICE_EMAIL;
    const password = process.env.DIRECTUS_SERVICE_PASSWORD;

    if (!email || !password) {
      throw new Error(
        'Falta DIRECTUS_SERVICE_EMAIL o DIRECTUS_SERVICE_PASSWORD en el entorno del servidor.',
      );
    }

    const sesion = createDirectus(URL_BASE).with(authentication('json', { autoRefresh: false }));
    tokenPromise = sesion
      .login(email, password, { mode: 'json' })
      .then((data) => {
        if (!data.access_token) {
          throw new Error('Directus no devolvió un access_token');
        }
        return data.access_token;
      })
      .catch((err: Error) => {
        tokenPromise = null;
        throw new Error(`No se pudo iniciar sesión con la cuenta de servicio: ${err.message}`);
      });
  }

  return tokenPromise;
}

interface Respuesta<T> {
  data: T;
}

/* GET con la query ya construida (la firma de fetch la entiende tal cual) */
export async function directusGet<T>(path: string): Promise<T> {
  const res = await fetch(`${URL_BASE}${path}`, {
    headers: { Authorization: `Bearer ${await getToken()}` },
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      `Directus ${path} → ${res.status}: ${json?.errors?.[0]?.message ?? 'sin detalle'}`,
    );
  }
  return json as T;
}

export async function directusPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${URL_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      `Directus POST ${path} → ${res.status}: ${json?.errors?.[0]?.message ?? 'sin detalle'}`,
    );
  }
  return json as T;
}

/* Atajo tipado para /items */
export function items<T>(path: string, query = '') {
  return directusGet<Respuesta<T[]>>(`/items/${path}${query}`);
}

/* Los id de las tablas de este proyecto son enteros: Directus los
   devuelve como número. Comparados contra ids que vienen del cliente
   (siempre texto en JSON), un `Set<string>` con números no encuentra
   nada y un `Map` con claves número no las encuentra en texto.
   Toda comparación de id pasa por aquí. */
export function idRelacion(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'object') {
    const id = (v as { id?: unknown }).id;
    return id == null ? null : String(id);
  }
  return String(v);
}
