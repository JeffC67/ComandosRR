/* ============================================================
   CommandCard — Portal Capacitación RR / AS400
   Tarjeta de comando con icono, etiqueta y tecla
   ============================================================ */

import { Icon } from '@/components/ui/Icons';
import { cn, getLucideIcon } from '@/lib/utils';
import type { Comando } from '@/types';

interface CommandCardProps {
  comando: Comando;
  compact?: boolean;
}

export function CommandCard({ comando, compact = false }: CommandCardProps) {
  const isAdvanced = comando.tipo === 'avanzado';
  const iconName = getLucideIcon(comando.icono);

  return (
    <article
      className={cn(
        'command-card flex items-center gap-4 w-full rounded-lg border-l-4 p-3 transition-all duration-300 cursor-pointer',
        'bg-surface border-border',
        isAdvanced
          ? 'border-l-accent'
          : 'border-l-primary',
        compact && 'gap-3 px-3'
      )}
      tabIndex={0}
      role="button"
      aria-label={`${comando.etiqueta}, tecla ${comando.tecla}`}
    >
      <span
        className={cn(
          'cmd-icon flex items-center justify-center rounded flex-shrink-0 transition-all duration-300',
          'bg-primary/10 text-primary',
          isAdvanced && 'bg-accent/10 text-accent',
          compact ? 'w-8 h-8 text-sm' : 'w-9 h-9 text-base'
        )}
        aria-hidden="true"
      >
        <Icon name={iconName} size={compact ? 16 : 20} />
      </span>

      <span className={cn('cmd-label flex-1 min-w-0 text-text-muted truncate', compact && 'text-sm')}>
        {comando.etiqueta}
      </span>

      <span
        className={cn(
          'cmd-key font-mono text-text bg-surface-3 border border-border rounded px-2.5 py-1 whitespace-nowrap text-center flex-shrink-0 transition-colors',
          'text-xs',
          compact && 'px-2 py-0.5'
        )}
      >
        {comando.tecla.replace(/\+/g, ' + ')}
      </span>
    </article>
  );
}

/* Variante para grid de ancho completo (módulo consultas) */
export function CommandCardFullWidth({ comando }: CommandCardProps) {
  return <CommandCard comando={comando} compact={true} />;
}