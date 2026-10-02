/* ============================================================
   Formulario de enlace — Portal Capacitación RR / AS400
   Lo usan /editor/enlaces/nuevo (crear) y
   /editor/enlaces/[id]/editar (corregir). Solo editor/admin
   llegan aquí (la página y la API lo exigen). Usa .form-* de
   globals.css, igual que FormularioProceso.
   ============================================================ */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Enlace } from '@/types';

export interface EnlaceFormInicial {
  categoria: string;
  grupo: string;
  nombre: string;
  url: string;
  descripcion: string;
  orden: string;
  estado: string;
}

export function inicialVacio(): EnlaceFormInicial {
  return { categoria: '', grupo: '', nombre: '', url: '', descripcion: '', orden: '0', estado: 'publicado' };
}

export function inicialDe(e: Enlace): EnlaceFormInicial {
  return {
    categoria: e.categoria,
    grupo: e.grupo,
    nombre: e.nombre,
    url: e.url ?? '',
    descripcion: e.descripcion ?? '',
    orden: String(e.orden ?? 0),
    estado: e.estado,
  };
}

export function FormularioEnlace({
  inicial,
  modo,
  enlaceId,
}: {
  inicial: EnlaceFormInicial;
  modo: 'crear' | 'editar';
  enlaceId?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(inicial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof EnlaceFormInicial) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (!form.categoria.trim()) throw new Error('La categoría es obligatoria');
      if (!form.grupo.trim()) throw new Error('El grupo es obligatorio');
      if (!form.nombre.trim()) throw new Error('El nombre es obligatorio');

      const body: Record<string, unknown> = {
        categoria: form.categoria,
        grupo: form.grupo,
        nombre: form.nombre,
        url: form.url,
        descripcion: form.descripcion,
        orden: form.orden,
        estado: form.estado,
      };

      const url = modo === 'crear' ? '/api/enlaces' : `/api/enlaces/${enlaceId}`;
      const res = await fetch(url, {
        method: modo === 'crear' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error ?? `Guardar → ${res.status}`);

      router.push('/editor/enlaces?guardado=1');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form-card" onSubmit={enviar}>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <label className="form-field">
        <span>Categoría *</span>
        <input
          value={form.categoria}
          onChange={(e) => set('categoria')(e.target.value)}
          required
          maxLength={60}
          placeholder="INDRA, HOGAR, MÓVIL…"
        />
      </label>

      <label className="form-field">
        <span>Grupo *</span>
        <input
          value={form.grupo}
          onChange={(e) => set('grupo')(e.target.value)}
          required
          maxLength={120}
          placeholder="SOPORTE HOGAR…"
        />
      </label>

      <label className="form-field">
        <span>Nombre *</span>
        <input
          value={form.nombre}
          onChange={(e) => set('nombre')(e.target.value)}
          required
          maxLength={120}
          placeholder="PARADIGMA"
        />
      </label>

      <label className="form-field">
        <span>URL (vacía = se muestra sin navegar)</span>
        <input
          value={form.url}
          onChange={(e) => set('url')(e.target.value)}
          maxLength={1024}
          placeholder="https://…"
          inputMode="url"
        />
      </label>

      <label className="form-field">
        <span>Descripción</span>
        <textarea value={form.descripcion} onChange={(e) => set('descripcion')(e.target.value)} rows={2} />
      </label>

      <div className="form-row">
        <label className="form-field">
          <span>Orden</span>
          <input
            type="number"
            value={form.orden}
            onChange={(e) => set('orden')(e.target.value)}
            min={0}
            step={1}
          />
        </label>

        <label className="form-field">
          <span>Estado</span>
          <select value={form.estado} onChange={(e) => set('estado')(e.target.value)}>
            <option value="publicado">Publicado</option>
            <option value="borrador">Borrador</option>
            <option value="archivado">Archivado</option>
          </select>
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Guardando…' : modo === 'crear' ? 'Crear enlace' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
