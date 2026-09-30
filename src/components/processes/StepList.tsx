/* ============================================================
   StepList — Portal Capacitación RR / AS400
   Pasos del proceso, agrupados en partes. La navegación es por
   grupo, igual que en la rama main: cada .modal-body-block es una
   parte, el .modal-progress marca en cuál estás y .modal-nav
   avanza y retrocede. Dentro de una parte se ven todos sus pasos.
   ============================================================ */

'use client';

import { useEffect, useRef, useState } from 'react';
import type { Paso } from '@/types';

interface StepListProps {
  pasos: Paso[];
  procesoTitulo: string;
}

/* Agrupa por `grupo` conservando el orden de llegada */
function agrupar(pasos: Paso[]): { grupo: string; pasos: Paso[] }[] {
  const salida: { grupo: string; pasos: Paso[] }[] = [];
  for (const paso of pasos) {
    const grupo = paso.grupo?.trim() || '';
    const ultimo = salida[salida.length - 1];
    if (ultimo && ultimo.grupo === grupo) ultimo.pasos.push(paso);
    else salida.push({ grupo, pasos: [paso] });
  }
  return salida;
}

export function StepList({ pasos, procesoTitulo }: StepListProps) {
  const grupos = agrupar(pasos);
  const [actual, setActual] = useState(0);
  const cuerpoRef = useRef<HTMLDivElement>(null);

  const total = grupos.length;
  const indice = Math.min(actual, Math.max(total - 1, 0));

  /* Al cambiar de parte, el foco va al bloque nuevo para que el lector
     de pantalla anuncie el contenido y el teclado no se quede atrás. */
  useEffect(() => {
    cuerpoRef.current?.focus();
  }, [indice]);

  if (total === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon" aria-hidden="true">
          📋
        </span>
        <span className="empty-state-title">Este proceso aún no tiene pasos</span>
      </div>
    );
  }

  /* Una sola parte: la navegación sobra y solo mostramos la lista */
  const conNavegacion = total > 1;
  const actualGrupo = grupos[indice];

  return (
    <section className="step-panel" aria-label={`Proceso: ${procesoTitulo}`}>
      {conNavegacion && (
        <div className="modal-progress">
          <div className="progress-steps">
            {grupos.map((g, i) => (
              <div
                key={`${g.grupo}-${i}`}
                className={`progress-step${i < indice ? ' completed' : ''}${i === indice ? ' active' : ''}`}
              >
                <span className="progress-dot">{i < indice ? '✓' : i + 1}</span>
                <span className="progress-label">{g.grupo || `Parte ${i + 1}`}</span>
                {i < total - 1 && <span className="progress-line" />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className="modal-body"
        ref={cuerpoRef}
        tabIndex={-1}
        key={indice}
        aria-live="polite"
      >
        <div className="modal-body-block">
          {conNavegacion && actualGrupo.grupo && (
            <span className="sub-section-title">{actualGrupo.grupo}</span>
          )}
          <ol>
            {actualGrupo.pasos.map((paso) => (
              <li
                key={paso.id}
                dangerouslySetInnerHTML={{ __html: paso.contenido }}
              />
            ))}
          </ol>
        </div>
      </div>

      {conNavegacion && (
        <div className="modal-nav">
          <button
            type="button"
            className="modal-nav-btn prev"
            onClick={() => setActual((i) => Math.max(0, i - 1))}
            disabled={indice === 0}
            aria-label="Parte anterior"
          >
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
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Anterior
          </button>

          <div className="nav-steps-indicator">
            {grupos.map((g, i) => (
              <span
                key={`${g.grupo}-dot-${i}`}
                className={`nav-dot${i === indice ? ' active' : ''}`}
              />
            ))}
          </div>

          <button
            type="button"
            className="modal-nav-btn next primary"
            onClick={() => setActual((i) => Math.min(total - 1, i + 1))}
            disabled={indice === total - 1}
            aria-label="Parte siguiente"
          >
            {indice === total - 1 ? 'Finalizar' : 'Siguiente'}
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
          </button>
        </div>
      )}
    </section>
  );
}
