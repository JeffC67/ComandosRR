/* ============================================================
   GameCta — Portal Capacitación RR / AS400
   Botón que abre el juego de teclas F1–F24. Estructura idéntica
   a la rama main: .game-cta > .game-cta-icon + .game-cta-text
   + .game-cta-arrow.
   ============================================================ */

'use client';

import { useEffect } from 'react';
import { JuegoTeclas } from './JuegoTeclas';

export function GameCta() {
  /* Al navegar por el router, el modal que quedó abierto en otra página
     debe cerrarse. */
  useEffect(() => {
    const on = () => window.dispatchEvent(new CustomEvent('juego:cerrar'));
    window.addEventListener('popstate', on);
    return () => window.removeEventListener('popstate', on);
  }, []);

  return (
    <>
      <button
        type="button"
        className="game-cta"
        aria-haspopup="dialog"
        onClick={() => window.dispatchEvent(new CustomEvent('juego:abrir'))}
      >
        <span className="game-cta-icon" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9 14h6" />
          </svg>
        </span>
        <span className="game-cta-text">Vuélvete más ágil con los comandos</span>
        <span className="game-cta-arrow" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </span>
      </button>

      <JuegoTeclas />
    </>
  );
}
