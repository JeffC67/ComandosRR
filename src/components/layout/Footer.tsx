/* ============================================================
   Footer — Portal Capacitación RR / AS400
   ============================================================ */

import { Icon } from '@/components/ui/Icons';

export function Footer() {
  return (
    <footer className="footer mt-auto bg-surface-3 border-t border-border py-8 px-6" style={{ padding: 'var(--space-8) var(--space-6)' }}>
      <div className="footer-content max-w-7xl mx-auto flex flex-col items-center gap-4 text-center">
        <div className="footer-brand flex items-center gap-2 text-text-muted font-semibold text-sm">
          <Icon name="home" size={20} className="text-primary" />
          Portal Capacitación RR / AS400
        </div>
        <p className="text-text-dim text-xs">© 2026 Jefferson & Leonardo — Todos los derechos reservados.</p>
        <p className="text-text-dim text-xs">Documento interno de referencia. Uso exclusivo para agentes de servicio al cliente.</p>
      </div>
    </footer>
  );
}