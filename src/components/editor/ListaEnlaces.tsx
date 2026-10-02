/* ============================================================
   ListaEnlaces — Portal Capacitación RR / AS400
   Lista del CRUD (/editor/enlaces) con buscador por texto en el
   cliente: filtra por nombre, descripción, categoría, grupo, estado
   y URL sin round-trip por pulsación.
   Mismo lenguaje visual que ProcesoBuscador: .proceso-buscador +
   .buscador-campo (lupa embebida) + .buscador-conteo.
   ============================================================ */
'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Enlace } from '@/types';
import { BotonEliminarEnlace } from '@/components/editor/BotonEliminarEnlace';

export function ListaEnlaces({ enlaces }: { enlaces: Enlace[] }) {
  const [q, setQ] = useState('');

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return enlaces;
    return enlaces.filter((e) =>
      [e.nombre, e.descripcion, e.categoria, e.grupo, e.estado, e.url].some((campo) =>
        campo ? String(campo).toLowerCase().includes(t) : false,
      ),
    );
  }, [enlaces, q]);

  if (enlaces.length === 0) {
    return <p className="empty-state">Todavía no hay enlaces en el catálogo.</p>;
  }

  return (
    <div className="proceso-buscador">
      <div className="buscador-campo">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar enlace..."
          aria-label="Buscar en la lista de enlaces"
        />
        {q && (
          <button type="button" className="buscador-clear" onClick={() => setQ('')} aria-label="Limpiar búsqueda">
            &times;
          </button>
        )}
      </div>

      {filtrados.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true">
            🔍
          </span>
          <span className="empty-state-title">Sin resultados</span>
          <p className="empty-state-text">No se encontraron enlaces para «{q}».</p>
          <button type="button" className="btn btn-secondary" onClick={() => setQ('')}>
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <>
          <ul className="review-list">
            {filtrados.map((e) => (
              <li key={e.id} className="review-item">
                <div>
                  <strong>{e.nombre}</strong>
                  <span className="review-meta">
                    {e.categoria} · {e.grupo} · {e.estado}
                    {e.url ? '' : ' · sin URL'}
                  </span>
                </div>
                <div className="review-actions">
                  <Link href={`/editor/enlaces/${e.id}/editar`} className="btn btn-secondary">
                    ✏️ Editar
                  </Link>
                  <BotonEliminarEnlace id={e.id} nombre={e.nombre} />
                </div>
              </li>
            ))}
          </ul>
          <p className="buscador-conteo" aria-live="polite">
            {filtrados.length} de {enlaces.length} enlace{enlaces.length === 1 ? '' : 's'}
          </p>
        </>
      )}
    </div>
  );
}
