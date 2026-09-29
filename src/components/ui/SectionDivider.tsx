/* ============================================================
   SectionDivider — Portal Capacitación RR / AS400
   Divisor visual entre secciones
   ============================================================ */

export function SectionDivider() {
  return (
    <hr
      className="section-divider"
      style={{
        border: 0,
        height: '1px',
        background: 'linear-gradient(to right, transparent, rgba(14, 165, 233, 0.4), transparent)',
        margin: 'var(--space-2) 0',
      }}
      aria-hidden="true"
    />
  );
}