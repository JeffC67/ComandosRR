/* ============================================================
   EmptyState — Portal Capacitación RR / AS400
   Bloque para listas sin contenido. Reemplaza a los .modal-empty y
   .modal-no-results que main usaba dentro de los modales.
   ============================================================ */

interface EmptyStateProps {
  icono: string;
  titulo: string;
  texto?: string;
  children?: React.ReactNode;
}

export function EmptyState({ icono, titulo, texto, children }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon" aria-hidden="true">
        {icono}
      </span>
      <span className="empty-state-title">{titulo}</span>
      {texto && <p className="empty-state-text">{texto}</p>}
      {children}
    </div>
  );
}
