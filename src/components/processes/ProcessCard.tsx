/* ============================================================
   ProcessCard — Portal Capacitación RR / AS400
   Tarjeta de proceso guiado con métricas y acción
   ============================================================ */

import Link from 'next/link';
import { Icon } from '@/components/ui/Icons';
import { cn, getProcessAccent, getLucideIcon } from '@/lib/utils';
import type { Proceso } from '@/types';

interface ProcessCardProps {
  proceso: Proceso;
}

export function ProcessCard({ proceso }: ProcessCardProps) {
  const accent = getProcessAccent(proceso);
  const iconName = getLucideIcon(proceso.icono);

  const accentStyles = {
    primary: {
      borderTop: 'bg-gradient-to-r from-primary to-secondary',
      iconBg: 'bg-primary/10 text-primary',
      iconHover: 'bg-primary text-white',
    },
    accent: {
      borderTop: 'bg-gradient-to-r from-accent to-amber-400',
      iconBg: 'bg-accent/10 text-accent',
      iconHover: 'bg-accent text-white',
    },
    success: {
      borderTop: 'bg-gradient-to-r from-success to-emerald-400',
      iconBg: 'bg-success/10 text-success',
      iconHover: 'bg-success text-white',
    },
  };

  const styles = accentStyles[accent];

  return (
    <article
      className={cn(
        'process-card relative bg-surface border border-border rounded-xl p-6 cursor-pointer shadow-sm transition-all duration-300 overflow-hidden flex flex-col items-start gap-3',
        'hover:-translate-y-1.5 hover:shadow-xl hover:border-primary/40'
      )}
      style={{
        padding: 'var(--space-8) var(--space-6)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform var(--transition-med), box-shadow var(--transition-med), border-color var(--transition-med)',
      }}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
          transition: 'opacity var(--transition-med)',
        }}
        aria-hidden="true"
      />

      {/* Icon */}
      <div
        className={cn(
          'process-icon flex items-center justify-center rounded-lg flex-shrink-0 transition-all duration-300',
          styles.iconBg
        )}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-md)',
        }}
        aria-hidden="true"
      >
        <Icon name={iconName} size={24} />
      </div>

      {/* Title */}
      <h3 className="text-text font-bold tracking-tight" style={{
        fontSize: 'var(--font-size-lg)',
        fontWeight: 700,
        letterSpacing: '-0.01em',
      }}>
        {proceso.titulo}
      </h3>

      {/* Description */}
      <p className="text-text-muted flex-1" style={{
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-muted)',
      }}>
        {proceso.descripcion}
      </p>

      {/* Meta */}
      <div className="process-meta flex gap-4 text-text-dim" style={{
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-text-dim)',
        marginTop: 'var(--space-2)',
      }}>
        {proceso.duracion_min && (
          <span className="flex items-center gap-1">
            <Icon name="clock" size={12} />
            {proceso.duracion_min} min
          </span>
        )}
      </div>

      {/* CTA */}
      <Link
        href={`/procesos/${proceso.slug}`}
        className="process-open inline-flex items-center gap-2 text-primary font-semibold text-sm mt-3 transition-transform duration-300 group"
        style={{
          color: 'var(--color-primary)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
          marginTop: 'var(--space-3)',
        }}
      >
        Ver proceso
        <Icon name="arrowRight" size={16} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    </article>
  );
}