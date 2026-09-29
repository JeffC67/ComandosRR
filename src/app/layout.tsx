/* ============================================================
   Root Layout — Portal Capacitación RR / AS400
   ============================================================ */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Portal de Capacitación RR y AS400',
  description: 'Tu guía de referencia rápida con los comandos y procesos esenciales para atender a tus clientes con eficiencia y seguridad.',
  authors: [{ name: 'Portal Capacitación RR / AS400' }],
  openGraph: {
    title: 'Portal Capacitación RR / AS400',
    description: 'Tu guía de referencia rápida para comandos y procesos en RR/AS400.',
    type: 'website',
  },
  robots: 'noindex, nofollow', // Red interna
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <head>
        <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230ea5e9'%3E%3Crect x='2' y='3' width='20' height='14' rx='2'/%3E%3Crect x='2' y='20' width='20' height='1'/%3E%3Crect x='5' y='6' width='3' height='3' fill='%23fff'/%3E%3Crect x='10' y='6' width='3' height='3' fill='%23fff'/%3E%3Crect x='15' y='6' width='3' height='3' fill='%23fff'/%3E%3C/svg%3E" />
      </head>
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="main-container flex-1 pt-20" style={{ paddingTop: 'calc(var(--navbar-height) + var(--space-10))' }}>
          <div className="container">
            {children}
          </div>
        </main>
        <Footer />
      </body>
    </html>
  );
}