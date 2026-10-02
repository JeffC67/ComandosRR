/* ============================================================
   ProcesoBuscador — Portal Capacitación RR / AS400
   Rejilla de procesos con filtro por texto y estados vacíos.
   Mismo lenguaje visual que la rama main: .proceso-buscador +
   .processes-grid, con .empty-state para los dos casos sin datos.
   El filtrado es de cliente: son pocos elementos y evita un
   round-trip por pulsación.
   ============================================================ */

'use client';

import { useMemo, useState } from 'react';
import { ProcessCard } from '@/components/processes/ProcessCard';
import type { Proceso } from '@/types';

interface ProcesoBuscadorProps {
  procesos: Proceso[];
  /** Nº de pasos por slug de proceso, para el "🔄 N pasos" de cada tarjeta */
  pasosPorProceso?: Record<string, number>;
  etiqueta?: string;
  placeholder?: string;
}

export function ProcesoBuscador({
  procesos,
  pasosPorProceso = {},
  etiqueta = 'Buscar proceso',
  placeholder = 'Buscar proceso...',
}: ProcesoBuscadorProps) {
  const [q, setQ] = useState('');

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return procesos;
    return procesos.filter((p) =>
      [p.titulo, p.descripcion, p.codigo, p.categoria].some((campo) =>
        campo ? campo.toLowerCase().includes(t) : false,
      ),
    );
  }, [procesos, q]);

  if (procesos.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon" aria-hidden="true">
          🚧
        </span>
        <span className="empty-state-title">Todavía no hay procesos</span>
        <p className="empty-state-text">
          Esta categoría está en construcción. Vuelve pronto para ver las guías completas.
        </p>
      </div>
    );
  }

  return (
    <div className="proceso-buscador">
      <div className="buscador-campo">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          aria-label={etiqueta}
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
          <p className="empty-state-text">No se encontraron procesos para «{q}».</p>
          <button type="button" className="btn btn-secondary" onClick={() => setQ('')}>
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <>
          <div className="processes-grid">
            {filtrados.map((proceso) => (
              <ProcessCard key={proceso.id} proceso={proceso} totalPasos={pasosPorProceso[proceso.slug]} />
            ))}
          </div>
          <p className="buscador-conteo" aria-live="polite">
            {filtrados.length} de {procesos.length} proceso{procesos.length === 1 ? '' : 's'}
          </p>
        </>
      )}
    </div>
  );
}
