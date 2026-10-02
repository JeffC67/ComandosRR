/* ============================================================
   Procesos Listing Page — Portal Capacitación RR / AS400
   /procesos

   Mismo encabezado que la rama main (module-header con icono) pero
   sin estilos inline: la lista de categorías con buscador viene de
   Directus, y el CRUD que tenía main aquí se resuelve en el panel
   de Directus con el rol Editor.
   ============================================================ */

import Link from 'next/link';
import { JuegoTeclas } from '@/components/game/JuegoTeclas';
import { GameLaunchButton } from '@/components/game/GameLaunchButton';
import { ProcesoBuscador } from '@/components/processes/ProcesoBuscador';
import { getCategorias, getPasosPorProcesoSlug, getProcesos, getProcesosByCategoria } from '@/lib/directus';

export const revalidate = 60;

export default async function ProcesosPage() {
  const [categorias, todos, pasosPorProceso] = await Promise.all([
    getCategorias(),
    getProcesos(),
    getPasosPorProcesoSlug(),
  ]);

  /* Un fetch por categoría: la vista agrupada no puede filtrar en cliente
     porque el buscador necesita la lista completa de cada grupo. */
  const porCategoria = await Promise.all(
    categorias.map(async (c) => [c.slug, await getProcesosByCategoria(c.slug)] as const),
  );
  const grupos = new Map(porCategoria);

  /* Procesos sin categoría asignada (no deberían existir, pero no se pierden) */
  const huerfanos = todos.filter((p) => !p.categoria || !grupos.has(p.categoria));

  return (
    <section className="module-section">
      <header className="module-header">
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
        <h1>
          Procesos guiados
          <span className="module-header-sub">
            {todos.length} proceso{todos.length === 1 ? '' : 's'} en {categorias.length} categorías
          </span>
        </h1>
        <div className="module-header-actions">
          <Link href="/procesos/nuevo" className="btn btn-primary">
            ➕ Proponer proceso
          </Link>
          <GameLaunchButton />
        </div>
      </header>

      <nav className="category-pills mb-8" aria-label="Categorías de procesos">
        <Link href="/procesos" className="category-pill" aria-pressed="true" aria-current="page">
          Todos <span className="category-pill-count">{todos.length}</span>
        </Link>
        {categorias.map((c) => (
          <Link key={c.id} href={`/procesos/${c.slug}`} className="category-pill" aria-pressed="false">
            <span aria-hidden="true">{c.icono}</span>
            {c.nombre} <span className="category-pill-count">{c.totalProcesos ?? 0}</span>
          </Link>
        ))}
      </nav>

      {categorias.map((c) => {
        const procesos = grupos.get(c.slug) ?? [];
        return (
          <section key={c.id} className="category-group">
            <div className="category-group-header">
              <h2 className="category-group-title">
                <span aria-hidden="true">{c.icono} </span>
                {c.nombre}
              </h2>
              <span className="category-group-count">
                {procesos.length} proceso{procesos.length === 1 ? '' : 's'}
              </span>
              <Link href={`/procesos/${c.slug}`} className="category-group-link">
                Ver solo esta categoría →
              </Link>
            </div>

            <ProcesoBuscador
              procesos={procesos}
              pasosPorProceso={pasosPorProceso}
              etiqueta={`Buscar en ${c.nombre}`}
              placeholder={`Buscar en ${c.nombre.toLowerCase()}...`}
            />
          </section>
        );
      })}

      {huerfanos.length > 0 && (
        <section className="category-group">
          <div className="category-group-header">
            <h2 className="category-group-title">Sin categoría</h2>
            <span className="category-group-count">
              {huerfanos.length} proceso{huerfanos.length === 1 ? '' : 's'}
            </span>
          </div>
          <ProcesoBuscador procesos={huerfanos} pasosPorProceso={pasosPorProceso} />
        </section>
      )}

      <JuegoTeclas />
    </section>
  );
}
