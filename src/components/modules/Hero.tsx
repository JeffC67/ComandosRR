/* ============================================================
   Hero — Portal Capacitación RR / AS400
   Estructura idéntica a la rama main; los datos vienen de Directus.
   ============================================================ */

import type { HeroStats } from '@/types';

interface HeroProps {
  stats: HeroStats;
}

export function Hero({ stats }: HeroProps) {
  return (
    <section id="inicio" className="module-section">
      <div className="hero">
        <div className="hero-content">
          <div className="hero-icon" aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>

          <h2>Dominio de RR y AS400</h2>
          <p className="hero-subtitle">
            Tu guía de referencia rápida con los comandos y procesos esenciales para atender a tus clientes con
            eficiencia y seguridad.
          </p>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-icon" aria-hidden="true">
                ⌨️
              </span>
              <div>
                <div className="stat-value">{stats.totalComandos}+</div>
                <div className="stat-label">Comandos</div>
              </div>
            </div>

            <div className="hero-stat">
              <span className="stat-icon" aria-hidden="true">
                🎬
              </span>
              <div>
                <div className="stat-value">{stats.totalVideos}</div>
                <div className="stat-label">Tutoriales</div>
              </div>
            </div>

            <div className="hero-stat">
              <span className="stat-icon" aria-hidden="true">
                📋
              </span>
              <div>
                <div className="stat-value">{stats.totalProcesos}</div>
                <div className="stat-label">Procesos guiados</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
