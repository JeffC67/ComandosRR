/* ============================================================
   Procesos Listing Page — Portal Capacitación RR / AS400
   Lista de tarjetas de procesos
   ============================================================ */

import { ProcessCard } from '@/components/processes/ProcessCard';
import { getModulos, getProcesos } from '@/lib/directus';

export const revalidate = 60;
export const dynamic = 'force-dynamic';

export default async function ProcesosPage() {
  const [modulo, procesos] = await Promise.all([
    getModulos().then(m => m.find(x => x.slug === 'procesos')!),
    getProcesos(),
  ]);

  return (
    <section id="procesos" className="module-section full-width-section" style={{ scrollMarginTop: '90px' }}>
      <div className="module-header flex items-center gap-4 mb-6 pb-4 border-b-2 border-border relative" style={{
        marginBottom: 'var(--space-6)',
        paddingBottom: 'var(--space-4)',
        borderBottom: '2px solid var(--color-border)',
      }}>
        <div className="module-header-icon flex items-center justify-center flex-shrink-0 w-11 h-11 rounded-lg border" style={{
          width: '44px',
          height: '44px',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(14, 165, 233, 0.05))',
          border: '1px solid rgba(14, 165, 233, 0.3)',
          color: 'var(--color-primary)',
          fontSize: '1.3rem',
        }} aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <h2 className="text-text font-bold tracking-tight" style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }}>
          {modulo.titulo}
          {modulo.descripcion && (
            <span className="module-header-sub block text-text-dim font-normal mt-1" style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 400,
              marginTop: '2px',
            }}>
              {modulo.descripcion}
            </span>
          )}
        </h2>
        <div className="absolute bottom-[-2px] left-0 h-[2px] w-20 rounded-full bg-primary" aria-hidden="true" />
      </div>

      <div className="processes-grid grid gap-6" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--space-6)',
      }}>
        {procesos.map((proceso) => (
          <ProcessCard key={proceso.id} proceso={proceso} />
        ))}
      </div>
    </section>
  );
}