/* ============================================================
   Button — Portal Capacitación RR / AS400

   Envuelto de las clases `.btn` de globals.css. Antes usaba
   utilidades de Tailwind (`bg-primary`, `px-4`, `focus-visible:...`)
   y Tailwind no está instalado en este proyecto, así que se renderizaba
   sin ningún estilo: todas las páginas usan directamente
   `className="btn btn-primary"` en su lugar.
   ============================================================ */

import type { ButtonHTMLAttributes, ForwardRefExoticComponent, RefAttributes } from 'react';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/Icons';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const VARIANTES = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  accent: 'btn-accent',
  ghost: 'btn-ghost',
} as const;

const TAMANOS = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
} as const;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      className={cn(
        'btn',
        VARIANTES[variant],
        TAMANOS[size],
        fullWidth && 'btn-block',
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <Icon name="loader" className="btn-spinner" aria-hidden="true" />
          <span>Cargando…</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="btn-icon">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="btn-icon">{rightIcon}</span>}
        </>
      )}
    </button>
  )
);

Button.displayName = 'Button';
