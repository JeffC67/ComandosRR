/* ============================================================
   Búsqueda Page — Portal Capacitación RR / AS400
   ============================================================ */

import { ModuleSection } from '@/components/modules/ModuleSection';
import { getModulos, getComandosByModulo, getVideosByModulo } from '@/lib/directus';

/* ISR: la página se cachea 60s y además se puede invalidar al vuelo desde
   /api/revalidate (webhook de Directus). `force-dynamic` lo desactivaba. */
export const revalidate = 60;

export default async function BusquedaPage() {
  const [modulo, comandos, videos] = await Promise.all([
    getModulos().then((m) => m.find((x) => x.slug === 'busqueda')!),
    getComandosByModulo('busqueda'),
    getVideosByModulo('busqueda'),
  ]);

  return (
    <>
      <ModuleSection modulo={modulo} comandos={comandos} videos={videos} />
    </>
  );
}
