/* ============================================================
   Nuevo proceso — Portal Capacitación RR / AS400
   /procesos/nuevo
   · agente: propone (queda en borrador para validación).
   · editor/admin: crean (pueden publicar directo).
   ============================================================ */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FormularioProceso } from '@/components/processes/FormularioProceso';
import { getSession } from '@/lib/auth';
import { getCategorias } from '@/lib/directus';

export const dynamic = 'force-dynamic';

export default async function NuevoProcesoPage({ searchParams }: { searchParams: Promise<{ enviado?: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login?redirect=/procesos/nuevo');
  const rol = session.role === 'admin' || session.role === 'editor' ? session.role : 'agente';

  const categorias = await getCategorias();
  const { enviado } = await searchParams;

  return (
    <section className="module-section">
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <Link href="/procesos">Procesos</Link>
        <span className="breadcrumb-sep" aria-hidden="true">
          /
        </span>
        <span aria-current="page">Nuevo proceso</span>
      </nav>

      <header className="module-header">
        <div className="module-header-icon" aria-hidden="true">
          ➕
        </div>
        <h1>
          {rol === 'agente' ? 'Proponer proceso' : 'Nuevo proceso'}
          <span className="module-header-sub">
            {rol === 'agente'
              ? 'Tu propuesta queda pendiente de validación: no se publica hasta que un editor la apruebe.'
              : 'Crea un proceso guiado con sus pasos.'}
          </span>
        </h1>
      </header>

      {enviado && (
        <p className="form-ok" role="status">
          ✅ Propuesta enviada a validación. Un editor la revisará antes de publicarla.
        </p>
      )}

      <FormularioProceso
        categorias={categorias}
        rol={rol}
        modo="crear"
        inicial={{
          titulo: '',
          descripcion: '',
          categoria: '',
          duracion_min: '',
          icono: '',
          codigo: '',
          nota: '',
          estado: 'borrador',
          pasos: [{ grupo: '', contenido: '' }],
        }}
      />
    </section>
  );
}
