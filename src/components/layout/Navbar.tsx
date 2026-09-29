/* ============================================================
   Navbar — Portal Capacitación RR / AS400
   Responsive con menú hamburguesa y scroll spy
   ============================================================ */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons, Icon } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof Icons.nav;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Inicio', icon: 'home' },
  { href: '/busqueda', label: 'Búsqueda', icon: 'busqueda' },
  { href: '/suscriptor', label: 'Suscriptor', icon: 'suscriptor' },
  { href: '/consultas', label: 'Consultas', icon: 'consultas' },
  { href: '/procesos', label: 'Procesos', icon: 'procesos' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('inicio');
  const pathname = usePathname() || '/';

  // Scroll spy para sección activa
  useEffect(() => {
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.boundingClientRect.top <= 120) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -66%' }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggleMenu = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <nav
      className="navbar fixed top-0 left-0 right-0 z-50 bg-bg/85 backdrop-blur-md border-b border-border shadow-md"
      aria-label="Navegación principal"
      style={{ height: 'var(--navbar-height)' }}
    >
      <div className="container flex items-center h-full">
        {/* Brand */}
        <div className="navbar-brand flex items-center gap-3 mr-8 flex-shrink-0">
          <div className="navbar-logo flex items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark text-white text-xl flex-shrink-0" style={{ width: '42px', height: '42px' }} aria-hidden="true">
            <Icon name="home" size={24} />
          </div>
          <div className="navbar-brand-text flex flex-col hidden sm:block">
            <h1 className="text-text font-bold text-lg leading-tight tracking-tight">Portal Capacitación</h1>
            <span className="text-xs text-secondary font-medium">RR / AS400 · v2.0</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="navbar-nav flex items-center flex-1 justify-end">
          {/* Desktop links */}
          <ul className="nav-links hidden md:flex items-center list-none gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'nav-link flex items-center gap-2 text-text-muted font-medium text-sm rounded-lg transition-colors',
                      'px-3 py-2',
                      isActive && 'bg-primary/15 text-primary'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon name={item.icon} size={18} className="opacity-80" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Mobile menu toggle */}
          <button
            className={cn(
              'menu-toggle md:hidden flex flex-col justify-center gap-1.5 p-2 rounded-md transition-colors',
              'hover:bg-surface-2',
              isOpen && 'open'
            )}
            onClick={toggleMenu}
            aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isOpen}
            aria-controls="mobile-nav"
          >
            <span
              className={cn(
                'block w-6 h-0.5 bg-text rounded-full transition-all duration-300',
                isOpen && 'translate-y-1.5 rotate-45'
              )}
              aria-hidden="true"
            />
            <span
              className={cn(
                'block w-6 h-0.5 bg-text rounded-full transition-all duration-300',
                isOpen && 'opacity-0'
              )}
              aria-hidden="true"
            />
            <span
              className={cn(
                'block w-6 h-0.5 bg-text rounded-full transition-all duration-300',
                isOpen && '-translate-y-1.5 -rotate-45'
              )}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div id="mobile-nav" className={cn('md:hidden overflow-hidden transition-all duration-300', isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0')}>
        <ul className="nav-links flex flex-col list-none gap-1 px-4 pb-4" role="navigation" aria-label="Menú móvil">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'nav-link flex items-center gap-3 text-text-muted font-medium text-sm rounded-lg transition-colors',
                    'px-4 py-3 justify-start w-full',
                    isActive && 'bg-primary/15 text-primary'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon name={item.icon} size={20} className="opacity-80 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}