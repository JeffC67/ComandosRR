/* ============================================================
   SiteChrome — Portal Capacitación RR / AS400
   Envuelve Navbar + contenido + Footer, excepto en /login, donde
   solo se muestra el formulario (que ya trae su propio encabezado).
   Es componente de cliente con usePathname: el layout raíz sigue
   sin leer cookies()/headers() y el ISR no se dinamiza.
   ============================================================ */

'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  /* Login limpio: sin barra de navegación ni pie. El resto del portal
     mantiene el chrome completo. */
  if (pathname === '/login') {
    return <main className="main-container">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="main-container">{children}</main>
      <Footer />
    </>
  );
}
