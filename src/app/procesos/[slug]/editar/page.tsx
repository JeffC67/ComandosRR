/* ============================================================
   Editar proceso — Portal Capacitación RR / AS400
   /procesos/[slug]/editar
   · editor/admin: corrigen cualquiera.
   · agente: solo sus borradores (creado_por = yo).
   ============================================================ */

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { FormularioProceso } from '@/components/processes/FormularioProceso';
import { getSession } from '@/lib/auth';
import { getCategorias, getPasosByProceso, getProcesoByIdSinFiltro, idCreador } from '@/lib/directus';
import { directusGet } from '@/lib/directus-api';

export const dynamic = 'force-dynamic';

async function porSlug(slug: string) {
  const data = await directusGet<{ data: { id: number }[] }>(
    `/items/procesos?filter[slug][_eq]=${encodeURIComponent(slug)}&fields=id&limit=1`,
  );
  if (!data.data[0]) return null;
  return getProcesoByIdSinFiltro(data.data[0].id);
}

export default async function EditarProcesoPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');
  const rol = session.role === 'admin' || session.role === 'editor' ? session.role : 'agente';

  const { slug } = await params;
  const proceso = await porSlug(slug);
  if (!proceso) notFound();

  // Permiso: editor/admin todo; agente solo sus borradores
  const creador = idCreador(proceso);
  const permitido = rol !== 'agente' || (proceso.estado === 'borrador' && creador === session.sub);
  if (!permitido) {
    return (
      <section className="module-section">
        <p className="form-error" role="alert">
          No tienes permiso para editar este proceso (solo tus borradores pendientes de validación).
        </p>
        <Link href={`/procesos/${slug}`} className="btn btn-secondary">
          Volver al proceso
        </Link>
      </section>
    );
  }

  const [categorias, pasos] = await Promise.all([getCategorias(), getPasosByProceso(proceso.id)]);
  const catId = await directusGet<{ data: { categoria: number | null }[] }>(
    `/items/procesos?filter[id][_eq]=${proceso.id}&fields=categoria&limit=1`,
  ).then((d) => d.data[0]?.categoria ?? null);

  return (
    <section className="module-section">
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <Link href="/procesos">Procesos</Link>
        <span className="breadcrumb-sep" aria-hidden="true">
          /
        </span>
        <Link href={`/procesos/${proceso.slug}`}>{proceso.titulo}</Link>
        <span className="breadcrumb-sep" aria-hidden="true">
          /
        </span>
        <span aria-current="page">Editar</span>
      </nav>

      <header className="module-header">
        <div className="module-header-icon" aria-hidden="true">
          ✏️
        </div>
        <h1>
          Editar proceso
          <span className="module-header-sub">
            {proceso.estado === 'borrador' ? 'Borrador pendiente de validación' : `Estado: ${proceso.estado}`}
          </span>
        </h1>
      </header>

      <FormularioProceso
        categorias={categorias}
        rol={rol}
        modo="editar"
        procesoId={proceso.id}
        inicial={{
          titulo: proceso.titulo,
          descripcion: proceso.descripcion ?? '',
          categoria: catId != null ? String(catId) : '',
          duracion_min: proceso.duracion_min != null ? String(proceso.duracion_min) : '',
          estado: proceso.estado,
          pasos: pasos.map((p) => ({ grupo: p.grupo ?? '', contenido: p.contenido })),
        }}
      />
    </section>
  );
}
