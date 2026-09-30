/* ============================================================
   Mi Progreso Page — Portal Capacitación RR / AS400
   ============================================================ */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ProgresoGrid } from '@/components/progress/ProgresoGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icons';
import { getProcesos } from '@/lib/directus';
import { getSession } from '@/lib/auth';
import { idRelacion } from '@/lib/directus-api';
import { getProgresoUsuario, getPromediosQuiz } from '@/lib/progreso';

export const dynamic = 'force-dynamic';

export default async function MiProgresoPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [procesos, progreso, promedios] = await Promise.all([
    getProcesos(),
    getProgresoUsuario(session.sub),
    getPromediosQuiz(session.sub),
  ]);

  const completados = new Set(
    progreso
      .map((p) => idRelacion(p.proceso))
      .filter((id): id is string => Boolean(id)),
  );

  const stats = [
    { label: 'Total procesos', valor: procesos.length, icono: 'clipboard-list', tono: '' },
    {
      label: 'Completados',
      valor: completados.size,
      icono: 'check-circle',
      tono: ' stats-card--success',
    },
    {
      label: 'Promedio quiz',
      valor: promedios.promedio === null ? '—' : `${promedios.promedio}%`,
      icono: 'award',
      tono: '',
    },
    { label: 'Evaluaciones', valor: promedios.intentos, icono: 'star', tono: '' },
  ];

  return (
    <section className="module-section">
      <header className="module-header">
        <div className="module-header-icon" aria-hidden="true">
          <span className="module-header-emoji">📈</span>
        </div>
        <h1>
          Mi Progreso
          <span className="module-header-sub">Hola, {session.email} — rastrea tu avance</span>
        </h1>
      </header>

      <div className="stats-grid mb-10">
        {stats.map((s) => (
          <div key={s.label} className={`stats-card${s.tono}`}>
            <span className="stats-card-icon" aria-hidden="true">
              <Icon name={s.icono} size={20} />
            </span>
            <div>
              <div className="stats-card-value">{s.valor}</div>
              <div className="stats-card-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="category-group-title mb-4">
        Procesos
      </h2>

      {procesos.length === 0 ? (
        <EmptyState
          icono="📋"
          titulo="No hay procesos disponibles"
          texto="Cuando se carguen procesos en Directus aparecerán aquí."
        />
      ) : (
        <ProgresoGrid
          procesos={procesos}
          completadosIds={completados}
          intentadosQuiz={promedios.porProceso}
        />
      )}
    </section>
  );
}
