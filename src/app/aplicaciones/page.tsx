/* ============================================================
   Aplicaciones — Portal Capacitación RR / AS400
   /aplicaciones
   Catálogo de enlaces rápidos (PortalAppsIndra: INDRA/HOGAR/MÓVIL),
   adaptado al proyecto: vive en Directus (colección `enlaces`) y
   se edita con el CRUD de editor (/editor/enlaces), no en un JS.
   Solo estado=publicado. Sin URL = se muestra sin navegar.
   ============================================================ */

import { getEnlacesPublicados } from '@/lib/directus';
import { EmptyState } from '@/components/ui/EmptyState';
import { BotonGestionarEnlaces } from '@/components/editor/BotonGestionarEnlaces';

export const revalidate = 60;

function hostDe(url: string | null): string {
  if (!url) return 'Sin URL configurada';
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export default async function AplicacionesPage() {
  const grupos = await getEnlacesPublicados();
  const total = grupos.reduce((n, g) => n + g.enlaces.length, 0);
  const categorias = [...new Set(grupos.map((g) => g.categoria))];

  return (
    <section className="module-section">
      <header className="module-header">
        <div className="module-header-icon" aria-hidden="true">
          🔗
        </div>
        <h1>
          Aplicaciones
          <span className="module-header-sub">
            {total} enlace{total === 1 ? '' : 's'} en {categorias.length} categoría
            {categorias.length === 1 ? '' : 's'}
          </span>
        </h1>
        <div className="module-header-actions">
          <BotonGestionarEnlaces />
        </div>
      </header>

      {grupos.length === 0 ? (
        <EmptyState
          icono="🔗"
          titulo="Todavía no hay enlaces"
          texto="El catálogo aparecerá aquí en cuanto se cargue desde Directus."
        />
      ) : (
        categorias.map((categoria) => {
          const delCategoria = grupos.filter((g) => g.categoria === categoria);
          const n = delCategoria.reduce((x, g) => x + g.enlaces.length, 0);
          return (
            <section key={categoria} className="category-group">
              <div className="category-group-header">
                <h2 className="category-group-title">{categoria}</h2>
                <span className="category-group-count">
                  {n} enlace{n === 1 ? '' : 's'}
                </span>
              </div>

              {delCategoria.map((g) => (
                <div key={`${g.categoria}|${g.grupo}`}>
                  <h3 className="category-group-subtitle">{g.grupo}</h3>
                  <div className="cards-grid">
                    {g.enlaces.map((e) =>
                      e.url ? (
                        <a
                          key={e.id}
                          className="command-card"
                          href={e.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${e.nombre} (abre en pestaña nueva)`}
                        >
                          <span className="cmd-icon" aria-hidden="true">
                            🔗
                          </span>
                          <span className="cmd-label">
                            {e.nombre}
                            {e.descripcion && <small className="cmd-desc">{e.descripcion}</small>}
                          </span>
                          <span className="cmd-key">{hostDe(e.url)}</span>
                        </a>
                      ) : (
                        <div
                          key={e.id}
                          className="command-card"
                          role="note"
                          aria-label={`${e.nombre} (sin URL configurada)`}
                          title="Sin URL configurada"
                        >
                          <span className="cmd-icon" aria-hidden="true">
                            🔗
                          </span>
                          <span className="cmd-label">
                            {e.nombre}
                            {e.descripcion && <small className="cmd-desc">{e.descripcion}</small>}
                          </span>
                          <span className="cmd-key">sin URL</span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ))}
            </section>
          );
        })
      )}
    </section>
  );
}
