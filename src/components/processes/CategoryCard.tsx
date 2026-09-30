/* ============================================================
   CategoryCard — Portal Capacitación RR / AS400
   Tarjeta de categoría de la portada. Estructura idéntica a la
   rama main: category-card > .category-icon, h3, p, .category-badge
   y .process-open. El destino es la página de la categoría.
   ============================================================ */

import Link from 'next/link';
import type { Categoria } from '@/types';

interface CategoryCardProps {
  categoria: Categoria;
  total: number;
}

export function CategoryCard({ categoria: cat, total }: CategoryCardProps) {
  /* main rotula el badge según el contenido: si la categoría no tiene
     procesos muestra "Próximamente"; si no, el número. */
  const badge = total > 0 ? `${total} ${total === 1 ? 'proceso' : 'procesos'}` : 'Próximamente';
  const tono = cat.tono === 'accent' || cat.tono === 'success' ? ` ${cat.tono}` : '';

  return (
    <Link
      href={`/procesos/${cat.slug}`}
      className={`category-card${tono}`}
      aria-label={`Ver procesos de la categoría ${cat.titulo_corto ?? cat.nombre}`}
    >
      <span className="category-icon" aria-hidden="true">
        {cat.icono}
      </span>
      <h3>{cat.titulo_corto ?? cat.nombre}</h3>
      <p>{cat.texto_tarjeta ?? cat.descripcion}</p>
      <span className="category-badge">{badge}</span>
      <span className="process-open">
        {cat.etiqueta_enlace || 'Ver procesos'}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </span>
    </Link>
  );
}
