/* ============================================================
   Editar enlace — /editor/enlaces/[id]/editar (solo editor/admin).
   ============================================================ */

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getEnlace, getListasEnlace } from '@/lib/directus';
import { FormularioEnlace } from '@/components/editor/FormularioEnlace';
import { inicialDe } from '@/lib/enlaces-form';

export const dynamic = 'force-dynamic';

export default async function EditarEnlacePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login?redirect=/editor/enlaces');
  if (session.role !== 'editor' && session.role !== 'admin') redirect('/');

  const { id } = await params;
  const enlace = await getEnlace(id);
  if (!enlace) notFound();

  let categorias: string[] = [];
  let gruposPorCategoria: Record<string, string[]> = {};
  try {
    const listas = await getListasEnlace();
    categorias = listas.categorias;
    gruposPorCategoria = listas.gruposPorCategoria;
  } catch (e) {
    console.error('GET /editor/enlaces/[id]/editar: getListasEnlace falló', e);
  }

  return (
    <section className="module-section">
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <Link href="/aplicaciones">Aplicaciones</Link>
        <span className="breadcrumb-sep" aria-hidden="true">
          /
        </span>
        <Link href="/editor/enlaces">Gestionar enlaces</Link>
        <span className="breadcrumb-sep" aria-hidden="true">
          /
        </span>
        <span aria-current="page">Editar enlace</span>
      </nav>

      <header className="module-header">
        <div className="module-header-icon" aria-hidden="true">
          ✏️
        </div>
        <h1>
          Editar enlace
          <span className="module-header-sub">{enlace.nombre}</span>
        </h1>
      </header>

      <FormularioEnlace
        inicial={inicialDe(enlace)}
        modo="editar"
        enlaceId={String(enlace.id)}
        categorias={categorias}
        gruposPorCategoria={gruposPorCategoria}
      />
    </section>
  );
}
