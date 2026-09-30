/* ============================================================
   Proceso / Categoría — Portal Capacitación RR / AS400
   /procesos/[slug]

   Una sola ruta dinámica para los dos casos: si el slug corresponde a
   una categoría se listan sus procesos; si corresponde a un proceso se
   muestra el detalle paso a paso. Evita tener /procesos/[slug] y
   /procesos/[categoria] compitiendo por el mismo segmento.

   En la rama main esto eran modales; aquí son páginas, pero el
   lenguaje visual (migas, pills de categoría, .step-panel) es el mismo.
   ============================================================ */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProcesoBuscador } from '@/components/processes/ProcesoBuscador';
import { StepList } from '@/components/processes/StepList';
import {
  getCategoriaBySlug,
  getCategorias,
  getPasosByProceso,
  getPasosPorProcesoSlug,
  getProcesoBySlug,
  getProcesosByCategoria,
} from '@/lib/directus';
import type { Categoria } from '@/types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;

  const cat = await getCategoriaBySlug(slug);
  if (cat) return { title: `${cat.nombre} — Procesos`, description: cat.descripcion ?? undefined };

  const proc = await getProcesoBySlug(slug);
  if (proc) return { title: `${proc.titulo} — Portal Capacitación RR / AS400` };

  return { title: 'No encontrado' };
}

export default async function ProcesoPage({ params }: PageProps) {
  const { slug } = await params;

  const cat = await getCategoriaBySlug(slug);
  if (cat) return <VistaCategoria cat={cat} />;

  const proceso = await getProcesoBySlug(slug);
  if (!proceso) notFound();

  return <VistaProceso slug={slug} />;
}

/* ---------------- Categoría: listado ---------------- */

async function VistaCategoria({ cat }: { cat: Categoria }) {
  const [categorias, procesos, pasosPorProceso] = await Promise.all([
    getCategorias(),
    getProcesosByCategoria(cat.slug),
    getPasosPorProcesoSlug(),
  ]);

  return (
    <section className="module-section">
      <Migas titulo={cat.nombre} />

      <header className="module-header">
        <div className="module-header-icon" aria-hidden="true">
          {cat.icono}
        </div>
        <h1>
          {cat.nombre}
          {cat.descripcion && <span className="module-header-sub">{cat.descripcion}</span>}
        </h1>
      </header>

      <Pills categorias={categorias} actual={cat.slug} total={procesos.length} />

      <ProcesoBuscador
        procesos={procesos}
        pasosPorProceso={pasosPorProceso}
        etiqueta={`Buscar en ${cat.nombre}`}
        placeholder={`Buscar en ${cat.nombre.toLowerCase()}...`}
      />
    </section>
  );
}

/* ---------------- Proceso: detalle ---------------- */

async function VistaProceso({ slug }: { slug: string }) {
  const proceso = await getProcesoBySlug(slug);
  if (!proceso) notFound();

  const [pasos, categorias] = await Promise.all([
    getPasosByProceso(proceso.id),
    getCategorias(),
  ]);

  const cat = categorias.find((c) => c.slug === proceso.categoria);

  return (
    <section className="module-section">
      <Migas titulo={proceso.titulo} />

      <header className="detail-header">
        <div className="detail-header-icon" aria-hidden="true">
          {proceso.icono}
        </div>
        <div>
          <h1 className="detail-title">{proceso.titulo}</h1>
          {proceso.descripcion && (
            <p className="detail-subtitle">{proceso.descripcion}</p>
          )}
        </div>
      </header>

      <div className="detail-badges">
        {cat && (
          <Link href={`/procesos/${cat.slug}`} className="badge badge-primary">
            <span aria-hidden="true">{cat.icono}</span>
            {cat.nombre}
          </Link>
        )}
        <span className="badge">
          <span aria-hidden="true">🔄</span> {pasos.length} pasos
        </span>
        {proceso.duracion_min && (
          <span className="badge">
            <span aria-hidden="true">⏱</span> {proceso.duracion_min} min
          </span>
        )}
        {proceso.codigo && <span className="cmd-key">{proceso.codigo}</span>}
      </div>

      {proceso.nota && (
        <div className="detail-note">
          <span>
            <strong>Nota: </strong>
            <span dangerouslySetInnerHTML={{ __html: proceso.nota }} />
          </span>
        </div>
      )}

      <StepList pasos={pasos} procesoTitulo={proceso.titulo} />
    </section>
  );
}

/* ---------------- Piezas compartidas ---------------- */

function Migas({ titulo }: { titulo: string }) {
  return (
    <nav className="breadcrumb" aria-label="Ruta de navegación">
      <Link href="/procesos">Procesos</Link>
      <span className="breadcrumb-sep" aria-hidden="true">
        /
      </span>
      <span aria-current="page">{titulo}</span>
    </nav>
  );
}

function Pills({
  categorias,
  actual,
  total,
}: {
  categorias: Categoria[];
  actual?: string;
  total?: number;
}) {
  return (
    <nav className="category-pills mb-6" aria-label="Categorías de procesos">
      <Link
        href="/procesos"
        className="category-pill"
        aria-pressed={!actual}
        aria-current={!actual ? 'page' : undefined}
      >
        Todos{typeof total === 'number' && !actual ? <span className="category-pill-count">{total}</span> : null}
      </Link>
      {categorias.map((c) => (
        <Link
          key={c.id}
          href={`/procesos/${c.slug}`}
          className="category-pill"
          aria-pressed={c.slug === actual}
          aria-current={c.slug === actual ? 'page' : undefined}
        >
          <span aria-hidden="true">{c.icono}</span>
          {c.nombre}
          <span className="category-pill-count">{c.totalProcesos ?? 0}</span>
        </Link>
      ))}
    </nav>
  );
}
