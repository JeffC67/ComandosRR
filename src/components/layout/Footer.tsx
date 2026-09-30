/* ============================================================
   Footer — Portal Capacitación RR / AS400
   Estructura idéntica a la rama main.
   ============================================================ */

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          Portal Capacitación RR / AS400
        </div>
        <p>© 2026 Leonardo Beltrán &amp; Jefferson Calderón &amp; Julian Mendez — Todos los derechos reservados.</p>
        <p>Documento interno de referencia. Uso exclusivo para agentes de servicio al cliente.</p>
      </div>
    </footer>
  );
}
