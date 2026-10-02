/* ============================================================
   Gestión de enlaces — Portal Capacitación RR / AS400
   /editor/enlaces — solo editor/admin (el middleware también lo exige).
   CRUD de la sección Aplicaciones (catálogo PortalAppsIndra):
   crear, corregir y eliminar enlaces; lo publicado se ve al
   instante en /aplicaciones (ISR + webhook).
   ============================================================ */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getTodosLosEnlaces } from '@/lib/directus';
import { BotonEliminarEnlace } from '@/components/editor/BotonEliminarEnlace';

export const dynamic = 'force-dynamic';

export default async function EnlacesPage({ searchParams }: { searchParams: Promise<{ guardado?: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login?redirect=/editor/enlaces');
  if (session.role !== 'editor' && session.role !== 'admin') redirect('/');

  const enlaces = await getTodosLosEnlaces();
  const { guardado } = await searchParams;

  return (
    <section className="module-section">
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <Link href="/aplicaciones">Aplicaciones</Link>
        <span className="breadcrumb-sep" aria-hidden="true">
          /
        </span>
        <span aria-current="page">Gestionar enlaces</span>
      </nav>

      <header className="module-header">
        <div className="module-header-icon" aria-hidden="true">
          🔗
        </div>
        <h1>
          Gestionar enlaces
          <span className="module-header-sub">
            {enlaces.length} enlace{enlaces.length === 1 ? '' : 's'} en el catálogo
          </span>
        </h1>
        <div className="module-header-actions">
          <Link href="/editor/enlaces/nuevo" className="btn btn-primary">
            ➕ Nuevo enlace
          </Link>
        </div>
      </header>

      {guardado && <p className="form-ok">Enlace guardado.</p>}

      {enlaces.length === 0 ? (
        <p className="empty-state">Todavía no hay enlaces en el catálogo.</p>
      ) : (
        <ul className="review-list">
          {enlaces.map((e) => (
            <li key={e.id} className="review-item">
              <div>
                <strong>{e.nombre}</strong>
                <span className="review-meta">
                  {e.categoria} · {e.grupo} · {e.estado}
                  {e.url ? '' : ' · sin URL'}
                </span>
              </div>
              <div className="review-actions">
                <Link href={`/editor/enlaces/${e.id}/editar`} className="btn btn-secondary">
                  ✏️ Editar
                </Link>
                <BotonEliminarEnlace id={e.id} nombre={e.nombre} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
