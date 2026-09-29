/* ============================================================
   Búsqueda Page — Portal Capacitación RR / AS400
   ============================================================ */

import { ModuleSection } from '@/components/modules/ModuleSection';
import { getModulos, getComandosByModulo, getVideosByModulo } from '@/lib/directus';

export const revalidate = 60;
export const dynamic = 'force-dynamic';

export default async function BusquedaPage() {
  const [modulo, comandos, videos] = await Promise.all([
    getModulos().then(m => m.find(x => x.slug === 'busqueda')!),
    getComandosByModulo('busqueda'),
    getVideosByModulo('busqueda'),
  ]);

  return (
    <>
      <ModuleSection modulo={modulo} comandos={comandos} videos={videos} />
    </>
  );
}