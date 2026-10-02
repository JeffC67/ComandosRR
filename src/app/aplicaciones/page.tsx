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
import { CatalogoEnlaces } from '@/components/editor/CatalogoEnlaces';

export const revalidate = 60;

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
        <CatalogoEnlaces grupos={grupos} />
      )}
    </section>
  );
}
