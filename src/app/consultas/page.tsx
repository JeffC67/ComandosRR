/* ============================================================
   Consultas Page — Portal Capacitación RR / AS400
   ============================================================ */

import { ModuleSection } from '@/components/modules/ModuleSection';
import { getModulos, getComandosByModulo, getVideosByModulo } from '@/lib/directus';

export const revalidate = 60;

export default async function ConsultasPage() {
  const [modulo, comandos, videos] = await Promise.all([
    getModulos().then(m => m.find(x => x.slug === 'consultas')!),
    getComandosByModulo('consultas'),
    getVideosByModulo('consultas'),
  ]);

  return (
    <>
      <ModuleSection modulo={modulo} comandos={comandos} videos={videos} />
    </>
  );
}