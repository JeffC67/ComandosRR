/* ============================================================
   ProcessCard — Portal Capacitación RR / AS400
   Tarjeta de proceso guiado. Marcado idéntico a la rama main:
   .process-card > .process-icon + h3 + p + .process-meta
   + .process-open. El acento (data-type) lo decide getProcessAccent
   a partir de la categoría, igual que en el sitio estático.
   ============================================================ */

import Link from 'next/link';
import { getProcessAccent } from '@/lib/utils';
import type { Proceso } from '@/types';

interface ProcessCardProps {
  proceso: Proceso;
  /** Nº de pasos, para el "N pasos" del meta como en main */
  totalPasos?: number;
}

export function ProcessCard({ proceso, totalPasos }: ProcessCardProps) {
  const acento = getProcessAccent(proceso);
  const dataType = acento === 'primary' ? undefined : acento;

  return (
    <Link
      href={`/procesos/${proceso.slug}`}
      className="process-card"
      data-type={dataType}
      aria-label={`Abrir proceso: ${proceso.titulo}`}
    >
      <span className="process-icon" aria-hidden="true">
        {proceso.icono}
      </span>
      <h3>{proceso.titulo}</h3>
      {proceso.descripcion && <p>{proceso.descripcion}</p>}

      {(proceso.duracion_min || totalPasos) && (
        <div className="process-meta">
          {proceso.duracion_min && <span>⏱ {proceso.duracion_min} min</span>}
          {totalPasos ? <span>🔄 {totalPasos} pasos</span> : null}
        </div>
      )}

      <span className="process-open">
        Ver proceso
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </span>
    </Link>
  );
}
