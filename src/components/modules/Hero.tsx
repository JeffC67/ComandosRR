/* ============================================================
   Hero — Portal Capacitación RR / AS400
   Sección principal con métricas calculadas desde API
   ============================================================ */

import { Icon } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';
import type { HeroStats } from '@/types';

interface HeroProps {
  stats: HeroStats;
}

export function Hero({ stats }: HeroProps) {
  return (
    <section id="inicio" className="module-section" style={{ scrollMarginTop: '90px' }}>
      <div
        className={cn(
          'hero relative overflow-hidden rounded-xl border border-border text-center',
          'bg-gradient-to-b from-surface-3 to-bg'
        )}
        style={{
          padding: 'var(--space-16) var(--space-6)',
          background: 'radial-gradient(ellipse at top, rgba(14, 165, 233, 0.12), transparent 60%), linear-gradient(180deg, var(--color-surface-3), var(--color-bg))',
        }}
      >
        <div className="hero-content relative z-10 max-w-3xl mx-auto">
          <div
            className="hero-icon inline-flex items-center justify-center rounded-xl mb-6 mx-auto"
            style={{
              width: '72px',
              height: '72px',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
              boxShadow: 'var(--shadow-glow)',
            }}
            aria-hidden="true"
          >
            <Icon name="home" size={32} className="text-white" />
          </div>

          <h2 className="font-black tracking-tight mb-4" style={{
            fontSize: 'var(--font-size-3xl)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            background: 'linear-gradient(90deg, var(--color-text), var(--color-secondary))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Dominio de RR y AS400
          </h2>

          <p className="hero-subtitle text-text-muted mx-auto mb-10 max-w-2xl" style={{
            fontSize: 'var(--font-size-lg)',
          }}>
            Tu guía de referencia rápida con los comandos y procesos esenciales para atender a tus clientes con eficiencia y seguridad.
          </p>

          <div className="hero-stats flex flex-wrap justify-center gap-6" style={{ gap: 'var(--space-8)' }}>
            <div className="hero-stat flex items-center gap-3 rounded-lg border border-border p-4" style={{
              background: 'rgba(51, 65, 85, 0.4)',
              padding: 'var(--space-3) var(--space-6)',
              borderRadius: 'var(--radius-md)',
            }}>
              <span className="stat-icon text-primary" style={{ fontSize: '1.4rem' }} aria-hidden="true">
                <Icon name="keyboard" size={24} />
              </span>
              <div>
                <div className="stat-value font-bold text-text" style={{ fontSize: 'var(--font-size-lg)' }}>
                  {stats.totalComandos}+
                </div>
                <div className="stat-label text-text-dim uppercase tracking-wider text-xs" style={{
                  fontSize: 'var(--font-size-xs)',
                  letterSpacing: '0.05em',
                }}>
                  Comandos
                </div>
              </div>
            </div>

            <div className="hero-stat flex items-center gap-3 rounded-lg border border-border p-4" style={{
              background: 'rgba(51, 65, 85, 0.4)',
              padding: 'var(--space-3) var(--space-6)',
              borderRadius: 'var(--radius-md)',
            }}>
              <span className="stat-icon text-primary" style={{ fontSize: '1.4rem' }} aria-hidden="true">
                <Icon name="video" size={24} />
              </span>
              <div>
                <div className="stat-value font-bold text-text" style={{ fontSize: 'var(--font-size-lg)' }}>
                  {stats.totalVideos}
                </div>
                <div className="stat-label text-text-dim uppercase tracking-wider text-xs" style={{
                  fontSize: 'var(--font-size-xs)',
                  letterSpacing: '0.05em',
                }}>
                  Tutoriales
                </div>
              </div>
            </div>

            <div className="hero-stat flex items-center gap-3 rounded-lg border border-border p-4" style={{
              background: 'rgba(51, 65, 85, 0.4)',
              padding: 'var(--space-3) var(--space-6)',
              borderRadius: 'var(--radius-md)',
            }}>
              <span className="stat-icon text-primary" style={{ fontSize: '1.4rem' }} aria-hidden="true">
                <Icon name="clipboardList" size={24} />
              </span>
              <div>
                <div className="stat-value font-bold text-text" style={{ fontSize: 'var(--font-size-lg)' }}>
                  {stats.totalProcesos}
                </div>
                <div className="stat-label text-text-dim uppercase tracking-wider text-xs" style={{
                  fontSize: 'var(--font-size-xs)',
                  letterSpacing: '0.05em',
                }}>
                  Procesos guiados
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}