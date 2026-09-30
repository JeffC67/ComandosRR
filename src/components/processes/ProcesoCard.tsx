/* ============================================================
   ProcesoCard (Progreso) — Portal Capacitación RR / AS400
   Tarjeta de proceso con su estado de completado. Reutiliza el
   marcado de la rama main (.process-card) y le añade la insignia de
   completado y el botón de marcar.
   ============================================================ */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getProcessAccent } from '@/lib/utils';
import type { Proceso } from '@/types';

interface ProcesoCardProps {
  proceso: Proceso;
  isCompleted: boolean;
  /** Mejor nota del quiz asociado, si la tiene */
  mejorQuiz?: number;
}

export function ProcesoCard({ proceso, isCompleted, mejorQuiz }: ProcesoCardProps) {
  const [completando, setCompletando] = useState(false);
  const [error, setError] = useState('');
  const acento = getProcessAccent(proceso);
  const dataType = isCompleted ? 'success' : acento === 'primary' ? undefined : acento;

  async function marcarCompletado() {
    if (isCompleted || completando) return;
    setCompletando(true);
    setError('');

    try {
      const res = await fetch('/api/progreso/completar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ procesoId: proceso.id }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo marcar como completado');
      }

      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo marcar como completado');
    } finally {
      setCompletando(false);
    }
  }

  return (
    <article className="process-card process-card--locked" data-type={dataType}>
      {isCompleted && (
        <span className="badge badge-success process-card-flag">
          <span aria-hidden="true">✓</span> Completado
        </span>
      )}

      <span className="process-icon" aria-hidden="true">
        {proceso.icono}
      </span>
      <h3>{proceso.titulo}</h3>
      {proceso.descripcion && <p>{proceso.descripcion}</p>}

      <div className="process-meta">
        {proceso.duracion_min && <span>⏱ {proceso.duracion_min} min</span>}
        {typeof mejorQuiz === 'number' && <span>🏅 {mejorQuiz}%</span>}
      </div>

      <div className="process-acciones">
        <Link href={`/procesos/${proceso.slug}`} className="process-open">
          {isCompleted ? 'Ver de nuevo' : 'Ver proceso'}
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
        </Link>

        {!isCompleted && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={marcarCompletado}
            disabled={completando}
          >
            {completando ? 'Guardando…' : 'Marcar completado'}
          </button>
        )}
      </div>

      {error && (
        <p className="form-error form-error--inline" role="alert">
          {error}
        </p>
      )}
    </article>
  );
}
