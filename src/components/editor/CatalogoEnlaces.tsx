/* ============================================================
   CatalogoEnlaces — Portal Capacitación RR / AS400
   Catálogo de /aplicaciones con buscador por texto.
   Mismo lenguaje visual que ProcesoBuscador: .proceso-buscador +
   .buscador-campo (lupa embebida) + .buscador-conteo.
   El filtrado es de cliente: son pocos elementos y evita un
   round-trip por pulsación (la página sigue en ISR).
   Busca por nombre, descripción, categoría, grupo y host de la URL.
   ============================================================ */

'use client';

import { useMemo, useState } from 'react';
import type { GrupoEnlaces } from '@/lib/directus';
import type { Enlace } from '@/types';

function hostDe(url: string | null): string {
  if (!url) return 'Sin URL configurada';
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/** Vuelve a agrupar (categoría → grupo) la lista ya filtrada. */
function agrupar(filtrados: Enlace[]): GrupoEnlaces[] {
  const grupos: GrupoEnlaces[] = [];
  for (const e of filtrados) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.categoria === e.categoria && ultimo.grupo === e.grupo) {
      ultimo.enlaces.push(e);
    } else {
      grupos.push({ categoria: e.categoria, grupo: e.grupo, enlaces: [e] });
    }
  }
  return grupos;
}

function TarjetaEnlace({ e }: { e: Enlace }) {
  if (e.url) {
    return (
      <a
        className="command-card"
        href={e.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${e.nombre} (abre en pestaña nueva)`}
      >
        <span className="cmd-icon" aria-hidden="true">
          🔗
        </span>
        <span className="cmd-label">
          {e.nombre}
          {e.descripcion && <small className="cmd-desc">{e.descripcion}</small>}
        </span>
        <span className="cmd-key">{hostDe(e.url)}</span>
      </a>
    );
  }
  return (
    <div className="command-card" role="note" aria-label={`${e.nombre} (sin URL configurada)`} title="Sin URL configurada">
      <span className="cmd-icon" aria-hidden="true">
        🔗
      </span>
      <span className="cmd-label">
        {e.nombre}
        {e.descripcion && <small className="cmd-desc">{e.descripcion}</small>}
      </span>
      <span className="cmd-key">sin URL</span>
    </div>
  );
}

export function CatalogoEnlaces({ grupos }: { grupos: GrupoEnlaces[] }) {
  const [q, setQ] = useState('');

  const total = useMemo(() => grupos.reduce((n, g) => n + g.enlaces.length, 0), [grupos]);

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return grupos;
    const planos = grupos.flatMap((g) => g.enlaces);
    return agrupar(
      planos.filter((e) =>
        [e.nombre, e.descripcion, e.categoria, e.grupo, hostDe(e.url)].some((campo) =>
          campo ? campo.toLowerCase().includes(t) : false,
        ),
      ),
    );
  }, [grupos, q]);

  const visibles = filtrados.reduce((n, g) => n + g.enlaces.length, 0);
  const categorias = [...new Set(filtrados.map((g) => g.categoria))];

  return (
    <div className="proceso-buscador">
      <div className="buscador-campo">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar aplicación..."
          aria-label="Buscar en el catálogo de aplicaciones"
        />
        {q && (
          <button type="button" className="buscador-clear" onClick={() => setQ('')} aria-label="Limpiar búsqueda">
            &times;
          </button>
        )}
      </div>

      {visibles === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true">
            🔍
          </span>
          <span className="empty-state-title">Sin resultados</span>
          <p className="empty-state-text">No se encontraron aplicaciones para «{q}».</p>
          <button type="button" className="btn btn-secondary" onClick={() => setQ('')}>
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <>
          {categorias.map((categoria) => {
            const delCategoria = filtrados.filter((g) => g.categoria === categoria);
            const n = delCategoria.reduce((x, g) => x + g.enlaces.length, 0);
            return (
              <section key={categoria} className="category-group">
                <div className="category-group-header">
                  <h2 className="category-group-title">{categoria}</h2>
                  <span className="category-group-count">
                    {n} enlace{n === 1 ? '' : 's'}
                  </span>
                </div>

                {delCategoria.map((g) => (
                  <div key={`${g.categoria}|${g.grupo}`}>
                    <h3 className="category-group-subtitle">{g.grupo}</h3>
                    <div className="cards-grid">
                      {g.enlaces.map((e) => (
                        <TarjetaEnlace key={e.id} e={e} />
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            );
          })}
          <p className="buscador-conteo" aria-live="polite">
            {visibles} de {total} enlace{total === 1 ? '' : 's'}
          </p>
        </>
      )}
    </div>
  );
}
