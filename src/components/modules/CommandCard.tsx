/* ============================================================
   CommandCard — Portal Capacitación RR / AS400
   Estructura idéntica a la rama main: command-card > cmd-icon,
   cmd-label y cmd-key. El texto con <strong> es lo que guarda
   Directus en el campo `tecla`.
   ============================================================ */

import type { Comando } from '@/types';

interface CommandCardProps {
  comando: Comando;
}

export function CommandCard({ comando }: CommandCardProps) {
  const isAdvanced = comando.tipo === 'avanzado';

  return (
    <div
      className={`command-card${isAdvanced ? ' highlight' : ''}`}
      tabIndex={0}
      role="button"
      aria-label={`${comando.etiqueta}, tecla ${comando.tecla}`}
    >
      <span className="cmd-icon" aria-hidden="true">
        {comando.icono}
      </span>
      <span className="cmd-label">{comando.etiqueta}</span>
      <span className="cmd-key">{comando.tecla}</span>
    </div>
  );
}
