/* ============================================================
   Navbar — Portal Capacitación RR / AS400
   Estructura y clases identicales a la rama main.
   ============================================================ */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/Icons';
import { UserMenu } from './UserMenu';

interface NavItem {
  href: string;
  label: string;
  icon: 'home' | 'search' | 'users' | 'help-circle' | 'clipboard-list';
}

const navItems: NavItem[] = [
  { href: '/', label: 'Inicio', icon: 'home' },
  { href: '/busqueda', label: 'Búsqueda', icon: 'search' },
  { href: '/suscriptor', label: 'Suscriptor', icon: 'users' },
  { href: '/consultas', label: 'Consultas', icon: 'help-circle' },
  { href: '/procesos', label: 'Procesos', icon: 'clipboard-list' },
];

interface NavbarProps {
  session: { email: string; role: string } | null;
}

export function Navbar({ session }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname() || '/';

  // Cerrar el menú al navegar
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav className="navbar" aria-label="Navegación principal">
      <Link href="/" className="navbar-brand">
        <div className="navbar-logo" aria-hidden="true">
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
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </div>
        <div className="navbar-brand-text">
          <h1>Portal Capacitación</h1>
          <span className="navbar-badge">RR / AS400 · v2.0</span>
        </div>
      </Link>

      <div className="navbar-nav">
        <button
          className={`menu-toggle${isOpen ? ' open' : ''}`}
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={isOpen}
          aria-controls="nav-links"
        >
          <span />
          <span />
          <span />
        </button>

        <ul className={`nav-links${isOpen ? ' active' : ''}`} id="nav-links">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`nav-link${isActive(item.href) ? ' active' : ''}`}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                <Icon name={item.icon} size={18} />
                {item.label}
              </Link>
            </li>
          ))}
          {session && (
            <li>
              <UserMenu session={session} />
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
