/* ============================================================
   Home Page — Portal Capacitación RR / AS400
   Hero + los 4 módulos, con la misma estructura que la rama main.
   Todo el contenido (comandos, videos, categorías, procesos) sale
   de Directus.
   ============================================================ */

import { Hero } from '@/components/modules/Hero';
import { ModuleSection } from '@/components/modules/ModuleSection';
import { CategoryCard } from '@/components/processes/CategoryCard';
import { GameCta } from '@/components/game/GameCta';
import { SectionDivider } from '@/components/ui/SectionDivider';
import {
  getModulos,
  getComandosByModulo,
  getVideosByModulo,
  getCategorias,
  getHeroStats,
} from '@/lib/directus';

export const revalidate = 60;

export default async function HomePage() {
  const [modulos, categorias, stats] = await Promise.all([
    getModulos(),
    getCategorias(),
    getHeroStats(),
  ]);

  /* Comandos y videos de cada módulo, en paralelo */
  const secciones = await Promise.all(
    modulos
      .filter((m) => m.slug !== 'procesos')
      .map(async (m) => ({
        modulo: m,
        comandos: await getComandosByModulo(m.slug),
        videos: await getVideosByModulo(m.slug),
      })),
  );

  const modProcesos = modulos.find((m) => m.slug === 'procesos');

  return (
    <>
      <Hero stats={stats} />

      {secciones.map(({ modulo, comandos, videos }) => (
        <div key={modulo.slug} className="stack-lg">
          <SectionDivider />
          <ModuleSection modulo={modulo} comandos={comandos} videos={videos} />
        </div>
      ))}

      {modProcesos && categorias.length > 0 && (
        <div className="stack-lg">
          <SectionDivider />
          <section id="procesos" className="module-section" aria-labelledby="procesos-title">
            <div className="module-header">
              <div className="module-header-icon" aria-hidden="true">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h2 id="procesos-title">
                {modProcesos.titulo}
                {modProcesos.descripcion && (
                  <span className="module-header-sub">{modProcesos.descripcion}</span>
                )}
              </h2>
            </div>

            <div className="category-grid">
              {categorias.map((cat) => (
                <CategoryCard key={cat.id} categoria={cat} total={cat.totalProcesos ?? 0} />
              ))}
            </div>

            <GameCta />
          </section>
        </div>
      )}
    </>
  );
}
