/* ============================================================
   Nuevo enlace — /editor/enlaces/nuevo (solo editor/admin).
   ============================================================ */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getListasEnlace } from '@/lib/directus';
import { FormularioEnlace } from '@/components/editor/FormularioEnlace';
import { inicialVacio } from '@/lib/enlaces-form';

export const dynamic = 'force-dynamic';

export default async function NuevoEnlacePage() {
  const session = await getSession();
  if (!session) redirect('/login?redirect=/editor/enlaces/nuevo');
  if (session.role !== 'editor' && session.role !== 'admin') redirect('/');

  /* Desplegables del formulario. Si Directus falla, el formulario sigue
     sirviendo con entradas de texto (no tumba la página). */
  let categorias: string[] = [];
  let gruposPorCategoria: Record<string, string[]> = {};
  try {
    const listas = await getListasEnlace();
    categorias = listas.categorias;
    gruposPorCategoria = listas.gruposPorCategoria;
  } catch (e) {
    console.error('GET /editor/enlaces/nuevo: getListasEnlace falló', e);
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
        <span aria-current="page">Nuevo enlace</span>
      </nav>

      <header className="module-header">
        <div className="module-header-icon" aria-hidden="true">
          ➕
        </div>
        <h1>
          Nuevo enlace
          <span className="module-header-sub">Aparece en /aplicaciones al publicar.</span>
        </h1>
      </header>

      <FormularioEnlace
        inicial={inicialVacio()}
        modo="crear"
        categorias={categorias}
        gruposPorCategoria={gruposPorCategoria}
      />
    </section>
  );
}
