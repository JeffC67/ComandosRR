/* ============================================================
   Juego de teclas F1–F24 — Portal Capacitación RR / AS400
   Entrena la ubicación de las teclas de función del teclado RR.
   F1–F12 directas; F13–F24 se pulsan con Shift+F1..F12.

   Marcado idéntico al de la rama main (section 15 de Styles.css):
     .modal-overlay.game-modal.active > .modal-content
       > .modal-header + .modal-body
         > .game-body > .game-target-wrap + .game-feedback + .game-stats
         > .game-correct-bar + .game-map

   IMPORTANTE: la clase "active" no es decorativa. En globals.css,
   .modal-overlay nace con opacity: 0 y pointer-events: none, y solo
   .modal-overlay.active lo vuelve visible e interactivo. Sin ella el
   modal se monta invisible y el juego parece no funcionar.
   En la rama main esto no hacia falta porque el juego era una pagina
   con .game-panel siempre visible, no un modal.

   Se abre desde el botón .game-cta de la portada o desde /procesos.
   ============================================================ */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_KEY = 24;
const LOCK_MS = 700;
const NEXT_MS = 650;

/* F1–F12 tal cual; F13–F24 equivalen a Shift+F1..F12 */
function labelOf(n: number) {
  return n <= 12 ? { name: `F${n}`, combo: `F${n}` } : { name: `F${n}`, combo: `Shift+F${n - 12}` };
}

type FeedbackState = 'idle' | 'correct' | 'wrong';

const ICONO_FEEDBACK: Record<FeedbackState, string> = {
  idle: '',
  correct: '✓',
  wrong: '✕',
};

export function JuegoTeclas() {
  const [abierto, setAbierto] = useState(false);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [streak, setStreak] = useState(0);
  const [target, setTarget] = useState(1);
  const [feedback, setFeedback] = useState<FeedbackState>('idle');
  const [feedbackText, setFeedbackText] = useState('Presiona la tecla indicada');
  const [hint, setHint] = useState('El comando correcto aparecerá aquí si fallas.');
  const [destacada, setDestacada] = useState<Record<number, 'hit' | 'miss'>>({});

  const lockUntil = useRef(0);
  const nextTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetRef = useRef(1);
  const targetAnterior = useRef(0);
  const cerrarRef = useRef<HTMLButtonElement>(null);

  /* Nuevo objetivo, evitando repetir el anterior */
  const nuevoObjetivo = useCallback(() => {
    let n = 1;
    do {
      n = Math.floor(Math.random() * MAX_KEY) + 1;
    } while (n === targetAnterior.current && MAX_KEY > 1);
    targetAnterior.current = n;
    targetRef.current = n;

    setTarget(n);
    setDestacada({});
    setFeedback('idle');
    setFeedbackText('Presiona la tecla indicada');
    setHint('El comando correcto aparecerá aquí si fallas.');
  }, []);

  const reiniciar = useCallback(() => {
    if (nextTimer.current) clearTimeout(nextTimer.current);
    setScore(0);
    setMisses(0);
    setStreak(0);
    targetAnterior.current = 0;
    nuevoObjetivo();
  }, [nuevoObjetivo]);

  const abrir = useCallback(() => {
    reiniciar();
    setAbierto(true);
  }, [reiniciar]);

  /* El CTA de la portada y el botón de /procesos mandan eventos:
     así el modal es un único componente con dos disparadores. */
  useEffect(() => {
    const onAbrir = () => abrir();
    const onCerrar = () => setAbierto(false);
    window.addEventListener('juego:abrir', onAbrir);
    window.addEventListener('juego:cerrar', onCerrar);
    return () => {
      window.removeEventListener('juego:abrir', onAbrir);
      window.removeEventListener('juego:cerrar', onCerrar);
    };
  }, [abrir]);

  /* Esc cierra; el foco entra al modal para poder teclado y leerlo */
  useEffect(() => {
    if (!abierto) return;
    cerrarRef.current?.focus();
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [abierto]);

  /* Bloquea el scroll del fondo mientras el modal está abierto */
  useEffect(() => {
    if (!abierto) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previo;
    };
  }, [abierto]);

  /* Solo interceptamos teclas con el juego abierto */
  useEffect(() => {
    if (!abierto) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (Date.now() < lockUntil.current) return;

      // No interferir con la escritura en formularios
      const el = event.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;

      const match = /^F(\d{1,2})$/.exec(event.key);
      if (!match) return;

      event.preventDefault();

      let n = parseInt(match[1], 10);
      if (n <= 12 && event.shiftKey) n += 12;
      if (n < 1 || n > MAX_KEY) return;

      if (nextTimer.current) clearTimeout(nextTimer.current);
      nextTimer.current = setTimeout(nuevoObjetivo, NEXT_MS);

      const objetivo = labelOf(targetRef.current);
      const pulsada = labelOf(n);

      if (n === targetRef.current) {
        setScore((s) => s + 1);
        setStreak((s) => s + 1);
        setFeedback('correct');
        setFeedbackText(`¡Correcto! ${objetivo.name}`);
        setHint(`Comando correcto: ${objetivo.name} = ${objetivo.combo}`);
        if (n > 12) setDestacada((d) => ({ ...d, [n]: 'hit' }));
      } else {
        setMisses((m) => m + 1);
        setStreak(0);
        setFeedback('wrong');
        setFeedbackText(`Incorrecto · ${pulsada.combo}`);
        setHint(`Comando correcto: ${objetivo.name} = ${objetivo.combo} · Tu respuesta: ${pulsada.combo}`);
        if (n > 12) setDestacada((d) => ({ ...d, [n]: 'miss' }));
      }

      lockUntil.current = Date.now() + LOCK_MS;
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (nextTimer.current) clearTimeout(nextTimer.current);
    };
  }, [abierto, nuevoObjetivo]);

  const objetivo = labelOf(target);

  return (
    <>
      {abierto && (
        <div
          className="modal-overlay game-modal active"
          role="dialog"
          aria-modal="true"
          aria-labelledby="juego-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAbierto(false);
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-header-text">
                <span className="modal-header-icon" aria-hidden="true">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
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
                <div>
                  <h3 id="juego-title">Vuélvete más ágil con los comandos</h3>
                  <span className="modal-subtitle">
                    Presiona la tecla indicada. F13 a F24 se logran con Shift + F1 a F12.
                  </span>
                </div>
              </div>
              <button
                ref={cerrarRef}
                type="button"
                className="close-btn"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar modal"
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="game-body">
                <div className="game-target-wrap">
                  <span className="game-target-label">Presiona</span>
                  <span className="game-target" role="status" aria-live="polite">
                    {objetivo.name}
                  </span>
                </div>

                <div className="game-feedback" data-state={feedback}>
                  <span className="game-feedback-icon" aria-hidden="true">
                    {ICONO_FEEDBACK[feedback]}
                  </span>
                  <span className="game-feedback-text">{feedbackText}</span>
                </div>

                <div className="game-stats">
                  <div className="game-stat">
                    <span className="game-stat-value">{score}</span>
                    <span className="game-stat-label">Aciertos</span>
                  </div>
                  <div className="game-stat">
                    <span className="game-stat-value">{misses}</span>
                    <span className="game-stat-label">Fallos</span>
                  </div>
                  <div className="game-stat">
                    <span className="game-stat-value">{streak}</span>
                    <span className="game-stat-label">Racha</span>
                  </div>
                  <button type="button" className="game-reset-btn" onClick={reiniciar}>
                    Reiniciar
                  </button>
                </div>
              </div>

              <div className="game-correct-bar" data-state={feedback}>
                <span>{hint}</span>
              </div>

              <div className="game-map">
                <div className="game-map-title">Referencia: F13 a F24 = Shift + F1 a F12</div>
                <div className="game-map-grid">
                  {Array.from({ length: 12 }, (_, i) => i + 13).map((n) => {
                    const l = labelOf(n);
                    const estado = destacada[n];
                    return (
                      <div key={n} className={`game-map-cell${estado ? ` ${estado}` : ''}`}>
                        <span className="game-map-name">{l.name}</span>
                        <span className="game-map-combo">{l.combo.replace('Shift+', 'Shift ')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
