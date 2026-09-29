/* ============================================================
   Proceso Detail Page — Portal Capacitación RR / AS400
   Página de detalle con pasos navegables (reemplaza modales)
   ============================================================ */

import { notFound } from 'next/navigation';
import { StepList } from '@/components/processes/StepList';
import { getProcesoBySlug, getPasosByProceso, getProcesos } from '@/lib/directus';

interface ProcesoPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: ProcesoPageProps) {
  const { slug } = await params;
  const proceso = await getProcesoBySlug(slug);
  if (!proceso) return { title: 'Proceso no encontrado' };
  return { title: `${proceso.titulo} — Portal Capacitación RR / AS400` };
}

export default async function ProcesoDetailPage({ params }: ProcesoPageProps) {
  const { slug } = await params;
  const [proceso, pasos] = await Promise.all([
    getProcesoBySlug(slug),
    getProcesos().then(procesos => {
      const p = procesos.find(x => x.slug === slug);
      return p ? getPasosByProceso(p.id) : [];
    }),
  ]);

  if (!proceso) notFound();

  return (
    <section className="module-section full-width-section" style={{ scrollMarginTop: '90px' }}>
      {/* Header */}
      <div className="mb-8" style={{ marginBottom: 'var(--space-8)' }}>
        <nav className="mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-text-dim">
            <li><a href="/procesos" className="hover:text-primary transition-colors">Procesos</a></li>
            <li aria-hidden="true">/</li>
            <li className="text-text" aria-current="page">{proceso.titulo}</li>
          </ol>
        </nav>
        <h1 className="text-text font-bold tracking-tight mb-2" style={{
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }}>
          {proceso.titulo}
        </h1>
        <p className="text-text-muted" style={{ fontSize: 'var(--font-size-lg)' }}>
          {proceso.descripcion}
        </p>
        <div className="flex flex-wrap gap-4 mt-4 text-text-dim text-sm" style={{ marginTop: 'var(--space-4)' }}>
          {proceso.duracion_min && (
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              {proceso.duracion_min} min
            </span>
          )}
          <span className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            {pasos.length} pasos
          </span>
        </div>
      </div>

      {/* Step List */}
      <StepList pasos={pasos} procesoTitulo={proceso.titulo} />
    </section>
  );
}