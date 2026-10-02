/* ============================================================
   Cola de validación — Portal Capacitación RR / AS400
   /editor/revision — solo editor/admin.
   Borradores pendientes (lo que propusieron los agentes):
   validar y publicar, corregir o eliminar. Antes de validar no
   se publica: el portal solo muestra estado=publicado.
   ============================================================ */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getProcesos, getProcesosPendientes, idCreador } from '@/lib/directus';
import { AccionesRevision } from '@/components/editor/AccionesRevision';

export const dynamic = 'force-dynamic';

export default async function RevisionPage() {
  const session = await getSession();
  if (!session) redirect('/login?redirect=/editor/revision');
  if (session.role !== 'editor' && session.role !== 'admin') redirect('/');

  const [pendientes, publicados] = await Promise.all([getProcesosPendientes(), getProcesos()]);

  return (
    <section className="module-section">
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <Link href="/procesos">Procesos</Link>
        <span className="breadcrumb-sep" aria-hidden="true">
          /
        </span>
        <span aria-current="page">Revisión editorial</span>
      </nav>

      <header className="module-header">
        <div className="module-header-icon" aria-hidden="true">
          🧐
        </div>
        <h1>
          Revisión editorial
          <span className="module-header-sub">
            {pendientes.length} pendiente{pendientes.length === 1 ? '' : 's'} de validación · {publicados.length}{' '}
            publicado{publicados.length === 1 ? '' : 's'}
          </span>
        </h1>
        <div className="module-header-actions">
          <Link href="/procesos/nuevo" className="btn btn-primary">
            ➕ Nuevo proceso
          </Link>
        </div>
      </header>

      <h2 className="category-group-title">Pendientes de validación (borrador)</h2>
      <p className="form-hint">
        Lo que envían los agentes a validar. Mientras esté en borrador no aparece en el portal: se publica al validar.
      </p>
      {pendientes.length === 0 ? (
        <p className="empty-state">No hay borradores pendientes. 🎉</p>
      ) : (
        <ul className="review-list">
          {pendientes.map((p) => (
            <li key={p.id} className="review-item">
              <div>
                <strong>{p.titulo}</strong>
                <span className="review-meta">
                  /procesos/{p.slug}
                  {(() => {
                    const c = idCreador(p);
                    return c
                      ? ` · propuesto por ${typeof p.creado_por === 'object' && p.creado_por?.email ? p.creado_por.email : c.slice(0, 8)}`
                      : ' · contenido base';
                  })()}
                </span>
                {p.descripcion && <p className="review-desc">{p.descripcion}</p>}
              </div>
              <AccionesRevision id={p.id} slug={p.slug} />
            </li>
          ))}
        </ul>
      )}

      <h2 className="category-group-title">Publicados</h2>
      <ul className="review-list">
        {publicados.map((p) => (
          <li key={p.id} className="review-item">
            <div>
              <Link href={`/procesos/${p.slug}`}>
                <strong>{p.titulo}</strong>
              </Link>
              <span className="review-meta">/procesos/{p.slug}</span>
            </div>
            <AccionesRevision id={p.id} slug={p.slug} publicado />
          </li>
        ))}
      </ul>
    </section>
  );
}
