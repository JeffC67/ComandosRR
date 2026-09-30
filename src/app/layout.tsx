/* ============================================================
   Root Layout — Portal Capacitación RR / AS400
   ============================================================ */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getSession } from '@/lib/auth';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.rr.local';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Portal de Capacitación RR y AS400',
    template: '%s | Portal Capacitación RR / AS400',
  },
  description: 'Tu guía de referencia rápida con los comandos y procesos esenciales para atender a tus clientes con eficiencia y seguridad.',
  keywords: ['RR', 'AS400', 'capacitación', 'call center', 'comandos', 'procesos guiados', 'telecomunicaciones'],
  authors: [{ name: 'Portal Capacitación RR / AS400' }],
  creator: 'Portal Capacitación RR / AS400',
  publisher: 'Portal Capacitación RR / AS400',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: siteUrl,
    siteName: 'Portal Capacitación RR / AS400',
    title: 'Portal Capacitación RR / AS400',
    description: 'Tu guía de referencia rápida para comandos y procesos en RR/AS400.',
    images: [
      {
        url: `${siteUrl}/og-image.svg`,
        width: 1200,
        height: 630,
        alt: 'Portal Capacitación RR / AS400',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portal Capacitación RR / AS400',
    description: 'Tu guía de referencia rápida para comandos y procesos en RR/AS400.',
    images: [`${siteUrl}/og-image.svg`],
  },
  verification: {
    other: {
      'robots': 'noindex, nofollow',
    },
  },
  category: 'education',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0f172a',
  colorScheme: 'dark',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="es" className={inter.variable}>
      <head>
        <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230ea5e9'%3E%3Crect x='2' y='3' width='20' height='14' rx='2'/%3E%3Crect x='2' y='20' width='20' height='1'/%3E%3Crect x='5' y='6' width='3' height='3' fill='%23fff'/%3E%3Crect x='10' y='6' width='3' height='3' fill='%23fff'/%3E%3Crect x='15' y='6' width='3' height='3' fill='%23fff'/%3E%3C/svg%3E" />
        <link rel="apple-touch-icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230ea5e9'%3E%3Crect x='2' y='3' width='20' height='14' rx='2'/%3E%3Crect x='2' y='20' width='20' height='1'/%3E%3Crect x='5' y='6' width='3' height='3' fill='%23fff'/%3E%3Crect x='10' y='6' width='3' height='3' fill='%23fff'/%3E%3Crect x='15' y='6' width='3' height='3' fill='%23fff'/%3E%3C/svg%3E" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body>
        <Navbar session={session ? { email: session.email, role: session.role } : null} />
        <main className="main-container">{children}</main>
        <Footer />
      </body>
    </html>
  );
}