/* ============================================================
   Gestión de enlaces — Portal Capacitación RR / AS400
   /editor/enlaces — solo editor/admin (el middleware también lo exige).
   CRUD de la sección Aplicaciones (catálogo PortalAppsIndra):
   crear, corregir y eliminar enlaces; lo publicado se ve al
   instante en /aplicaciones (ISR + webhook).
   ============================================================ */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getTodosLosEnlaces } from '@/lib/directus';
import type { Enlace } from '@/types';
import { ListaEnlaces } from '@/components/editor/ListaEnlaces';
import { AvisoGuardado } from '@/components/editor/AvisoGuardado';

export const dynamic = 'force-dynamic';

export default async function EnlacesPage({ searchParams }: { searchParams: Promise<{ guardado?: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login?redirect=/editor/enlaces');
  if (session.role !== 'editor' && session.role !== 'admin') redirect('/');

  /* La lectura del catálogo no puede tumbar la página con un Digest:
     si Directus falla, se registra el motivo en los logs del servidor y
     se muestra un error accionable solo para editor/admin. */
  let enlaces: Enlace[] = [];
  let errorCatalogo: string | null = null;
  try {
    const filas: unknown = await getTodosLosEnlaces();
    if (!Array.isArray(filas)) throw new Error('Directus devolvió un catálogo con formato inválido.');
    enlaces = filas as Enlace[];
  } catch (e) {
    console.error('GET /editor/enlaces: getTodosLosEnlaces falló', e);
    errorCatalogo = e instanceof Error ? e.message : 'No se pudo leer el catálogo.';
  }
  const { guardado } = await searchParams;

  return (
    <section className="module-section">
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <Link href="/aplicaciones">Aplicaciones</Link>
        <span className="breadcrumb-sep" aria-hidden="true">
          /
        </span>
        <span aria-current="page">Gestionar enlaces</span>
      </nav>

      <header className="module-header">
        <div className="module-header-icon" aria-hidden="true">
          🔗
        </div>
        <h1>
          Gestionar enlaces
          <span className="module-header-sub">
            {enlaces.length} enlace{enlaces.length === 1 ? '' : 's'} en el catálogo
          </span>
        </h1>
        <div className="module-header-actions">
          <Link href="/editor/enlaces/nuevo" className="btn btn-primary">
            ➕ Nuevo enlace
          </Link>
        </div>
      </header>

      {guardado && <AvisoGuardado />}
      {errorCatalogo && (
        <p className="form-error" role="alert">
          No se pudo cargar el catálogo desde Directus: {errorCatalogo}
        </p>
      )}

      {!errorCatalogo && <ListaEnlaces enlaces={enlaces} />}
    </section>
  );
}
