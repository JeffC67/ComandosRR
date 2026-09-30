/* ============================================================
   GameLaunchButton — Portal Capacitación RR / AS400
   Botón que abre el juego de teclas. Se usa en /procesos, donde no
   hay sitio para el CTA grande de la portada.
   ============================================================ */

'use client';

export function GameLaunchButton() {
  return (
    <button
      type="button"
      className="game-launch-btn"
      aria-haspopup="dialog"
      onClick={() => window.dispatchEvent(new CustomEvent('juego:abrir'))}
    >
      <span className="game-launch-icon" aria-hidden="true">
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
      Juego de teclas F1–F24
    </button>
  );
}
