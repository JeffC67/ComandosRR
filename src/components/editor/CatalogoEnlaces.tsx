/* ============================================================
   CatalogoEnlaces — Portal Capacitación RR / AS400
   Catálogo de /aplicaciones con buscador por texto + filtro por
   categoría, como la versión original (PortalAppsIndra):
   nav de categorías arriba (píldoras .category-pill, primera
   activa por defecto), grupos colapsables tipo acordeón
   (aria-expanded + chevron) y contador.
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

/* null = "Todas las categorías". */
type FiltroCategoria = string | null;

function hostDe(url: string | null): string {
  if (!url) return 'Sin URL configurada';
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/** Clave estable de cada grupo (categoría + grupo). */
function claveGrupo(categoria: string, grupo: string): string {
  return `${categoria}|${grupo}`;
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

/** Aplana conservando el orden (categoría → grupo → orden). */
function aplanar(grupos: GrupoEnlaces[]): Enlace[] {
  return grupos.flatMap((g) => g.enlaces);
}

function coincide(e: Enlace, t: string): boolean {
  return [e.nombre, e.descripcion, e.categoria, e.grupo, hostDe(e.url)].some((campo) =>
    campo ? campo.toLowerCase().includes(t) : false,
  );
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
  const categorias = useMemo(() => [...new Set(grupos.map((g) => g.categoria))], [grupos]);
  const total = useMemo(() => grupos.reduce((n, g) => n + g.enlaces.length, 0), [grupos]);

  /* Como la original: primera categoría activa por defecto. */
  const [cat, setCat] = useState<FiltroCategoria>(categorias[0] ?? null);
  const [q, setQ] = useState('');
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>(() => {
    const primero = grupos[0];
    return primero ? { [claveGrupo(primero.categoria, primero.grupo)]: true } : {};
  });

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    let planos = aplanar(grupos);
    if (cat) planos = planos.filter((e) => e.categoria === cat);
    if (t) planos = planos.filter((e) => coincide(e, t));
    return agrupar(planos);
  }, [grupos, cat, q]);

  const visibles = filtrados.reduce((n, g) => n + g.enlaces.length, 0);
  const buscando = q.trim() !== '';
  /* En resultados de búsqueda todo queda expandido, como la original. */
  const estaAbierto = (g: GrupoEnlaces) => buscando || abiertos[claveGrupo(g.categoria, g.grupo)] === true;

  const elegirCategoria = (c: FiltroCategoria) => {
    setCat(c);
    setQ('');
    const vis = c ? grupos.filter((g) => g.categoria === c) : grupos;
    const primero = vis[0];
    setAbiertos(primero ? { [claveGrupo(primero.categoria, primero.grupo)]: true } : {});
  };

  const alternar = (g: GrupoEnlaces) => {
    const k = claveGrupo(g.categoria, g.grupo);
    setAbiertos((a) => ({ ...a, [k]: !a[k] }));
  };

  const cuentaCategoria = (c: string) =>
    grupos.filter((g) => g.categoria === c).reduce((n, g) => n + g.enlaces.length, 0);

  if (total === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon" aria-hidden="true">
          🔗
        </span>
        <span className="empty-state-title">Todavía no hay enlaces</span>
        <p className="empty-state-text">El catálogo aparecerá aquí en cuanto se cargue desde Directus.</p>
      </div>
    );
  }

  return (
    <div className="proceso-buscador">
      <nav className="category-pills" aria-label="Filtrar por categoría">
        <button
          type="button"
          className="category-pill"
          aria-pressed={cat === null}
          onClick={() => elegirCategoria(null)}
        >
          Todas
          <span className="category-pill-count">{total}</span>
        </button>
        {categorias.map((c) => (
          <button
            key={c}
            type="button"
            className="category-pill"
            aria-pressed={cat === c}
            onClick={() => elegirCategoria(c)}
          >
            {c}
            <span className="category-pill-count">{cuentaCategoria(c)}</span>
          </button>
        ))}
      </nav>

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
          <p className="empty-state-text">
            No se encontraron aplicaciones{cat ? ` en «${cat}»` : ''} para «{q}».
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setQ('');
            }}
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <>
          {filtrados.map((g) => {
            const k = claveGrupo(g.categoria, g.grupo);
            const abierto = estaAbierto(g);
            return (
              <section key={k} className="category-group">
                <button
                  type="button"
                  className="collapsible-header"
                  aria-expanded={abierto}
                  onClick={() => alternar(g)}
                >
                  <span className="category-group-title">
                    {cat === null && <span className="enlaces-grupo-cat">{g.categoria} · </span>}
                    {g.grupo}
                  </span>
                  <span className="category-group-count">
                    {g.enlaces.length} enlace{g.enlaces.length === 1 ? '' : 's'}
                  </span>
                  <span className="collapsible-chevron" aria-hidden="true">
                    ▼
                  </span>
                </button>
                {abierto && (
                  <div className="cards-grid">
                    {g.enlaces.map((e) => (
                      <TarjetaEnlace key={e.id} e={e} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
          <p className="buscador-conteo" aria-live="polite">
            {cat ?? 'Todas'} · {visibles} de {total} enlace{total === 1 ? '' : 's'}
          </p>
        </>
      )}
    </div>
  );
}
