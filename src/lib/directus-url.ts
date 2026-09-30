/* ============================================================
   URL de Directus — Portal Capacitación RR / AS400

   `DIRECTUS_URL` es la variable de servidor: Next.js NO la inlinea en el
   bundle, así que se puede cambiar sin recompilar. Antes se usaba
   `NEXT_PUBLIC_DIRECTUS_URL` en todas partes, que al compilarse queda
   incrustada y obliga a reconstruir para cambiar de host.

   `NEXT_PUBLIC_DIRECTUS_URL` se mantiene como respaldo y es la que usa
   next.config.ts para la regla de /assets.
   ============================================================ */

export const DEFAULT_DIRECTUS_URL = 'https://portal.rr.local';

export function directusUrl(): string {
  return (
    process.env.DIRECTUS_URL ||
    process.env.NEXT_PUBLIC_DIRECTUS_URL ||
    DEFAULT_DIRECTUS_URL
  );
}
