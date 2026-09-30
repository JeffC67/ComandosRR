/* ============================================================
   UserMenu — Portal Capacitación RR / AS400
   Menú de usuario autenticado. Se apoya en las clases del navbar de
   la rama main más un desplegable propio.
   ============================================================ */

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icons';

interface UserMenuProps {
  session: { email: string; role: string } | null;
}

export function UserMenu({ session }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  /* Cierra al hacer clic fuera y al pulsar Escape */
  useEffect(() => {
    if (!isOpen) return;

    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onEsc);
    };
  }, [isOpen]);

  if (!session) return null;

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="user-menu-trigger"
        aria-label="Menú de usuario"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <span className="user-menu-avatar" aria-hidden="true">
          <Icon name="user" size={16} />
        </span>
        <span className="user-menu-email">{session.email}</span>
        <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} />
      </button>

      {isOpen && (
        <div className="user-menu-panel" role="menu">
          <div className="user-menu-head">
            <p className="user-menu-head-label">Conectado como</p>
            <p className="user-menu-head-email">{session.email}</p>
            <span className="badge badge-primary">{session.role}</span>
          </div>

          <Link
            href="/mi-progreso"
            className="user-menu-item"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <Icon name="clipboard-list" size={18} />
            Mi progreso
          </Link>

          <a href="/api/auth/logout" className="user-menu-item user-menu-item--exit" role="menuitem">
            <Icon name="log-out" size={18} />
            Cerrar sesión
          </a>
        </div>
      )}
    </div>
  );
}
