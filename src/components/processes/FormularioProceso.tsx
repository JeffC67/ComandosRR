/* ============================================================
   Formulario de proceso — Portal Capacitación RR / AS400
   Lo usan /procesos/nuevo (proponer/crear) y
   /procesos/[slug]/editar (corregir). Sin estilos inline: usa
   .form-* de globals.css.
   ============================================================ */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Categoria } from '@/types';

export interface PasoForm {
  grupo: string;
  contenido: string;
}

export interface ProcesoFormInicial {
  id?: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  duracion_min: string;
  icono: string;
  codigo: string;
  nota: string;
  estado?: string;
  pasos: PasoForm[];
}

export function FormularioProceso({
  categorias,
  inicial,
  modo,
  rol,
  procesoId,
}: {
  categorias: Categoria[];
  inicial: ProcesoFormInicial;
  modo: 'crear' | 'editar';
  rol: 'agente' | 'editor' | 'admin';
  procesoId?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(inicial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const setTitulo = (v: string) => setForm((f) => ({ ...f, titulo: v }));

  const setPaso = (i: number, k: keyof PasoForm, v: string) =>
    setForm((f) => ({
      ...f,
      pasos: f.pasos.map((p, j) => (j === i ? { ...p, [k]: v } : p)),
    }));

  const agregarPaso = () => setForm((f) => ({ ...f, pasos: [...f.pasos, { grupo: '', contenido: '' }] }));

  const quitarPaso = (i: number) => setForm((f) => ({ ...f, pasos: f.pasos.filter((_, j) => j !== i) }));

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const pasos = form.pasos
        .filter((p) => p.contenido.trim())
        .map((p, i) => ({
          grupo: p.grupo.trim() || null,
          contenido: p.contenido,
          orden: i + 1,
        }));
      if (!form.titulo.trim()) throw new Error('El título es obligatorio');
      if (pasos.length === 0) throw new Error('Añade al menos un paso');

      const body: Record<string, unknown> = {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || null,
        categoria: form.categoria ? Number(form.categoria) : null,
        duracion_min: form.duracion_min ? Number(form.duracion_min) : null,
        icono: form.icono.trim() || null,
        codigo: form.codigo.trim() || null,
        nota: form.nota.trim() || null,
        pasos,
      };
      // Solo editor/admin eligen estado; el agente siempre propone borrador
      if (rol !== 'agente' && form.estado) body.estado = form.estado;

      const url = modo === 'crear' ? '/api/procesos' : `/api/procesos/${procesoId}`;
      const res = await fetch(url, {
        method: modo === 'crear' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error ?? `Guardar → ${res.status}`);

      if (modo === 'crear' && j?.pendiente) {
        router.push('/procesos/nuevo?enviado=1');
        router.refresh();
        return;
      }
      const slug = j?.slug;
      router.push(slug ? `/procesos/${slug}` : '/procesos');
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
        <span>Título *</span>
        <input value={form.titulo} onChange={(e) => setTitulo(e.target.value)} required maxLength={255} />
      </label>

      <label className="form-field">
        <span>Descripción</span>
        <textarea
          value={form.descripcion}
          onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
          rows={3}
        />
      </label>

      <div className="form-row">
        <label className="form-field">
          <span>Categoría</span>
          <select value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}>
            <option value="">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Duración (min)</span>
          <input
            type="number"
            min={1}
            value={form.duracion_min}
            onChange={(e) => setForm((f) => ({ ...f, duracion_min: e.target.value }))}
          />
        </label>
      </div>

      <div className="form-row">
        <label className="form-field">
          <span>Icono (emoji)</span>
          <input
            value={form.icono}
            onChange={(e) => setForm((f) => ({ ...f, icono: e.target.value }))}
            maxLength={64}
          />
        </label>
        <label className="form-field">
          <span>Código</span>
          <input
            value={form.codigo}
            onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
            maxLength={32}
          />
        </label>
      </div>

      <label className="form-field">
        <span>Nota (HTML permitido)</span>
        <textarea value={form.nota} onChange={(e) => setForm((f) => ({ ...f, nota: e.target.value }))} rows={2} />
      </label>

      {rol !== 'agente' && (
        <label className="form-field">
          <span>Estado</span>
          <select value={form.estado} onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}>
            <option value="borrador">Borrador (pendiente de validación)</option>
            <option value="publicado">Publicado (visible en el portal)</option>
            <option value="archivado">Archivado</option>
          </select>
        </label>
      )}

      <fieldset className="form-fieldset">
        <legend>Pasos *</legend>
        {form.pasos.map((p, i) => (
          <div key={i} className="form-paso">
            <label className="form-field">
              <span>Grupo (opcional)</span>
              <input
                value={p.grupo}
                onChange={(e) => setPaso(i, 'grupo', e.target.value)}
                placeholder="Parte 1: …"
                maxLength={255}
              />
            </label>
            <label className="form-field">
              <span>Paso {i + 1} *</span>
              <textarea
                value={p.contenido}
                onChange={(e) => setPaso(i, 'contenido', e.target.value)}
                rows={2}
                required
              />
            </label>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => quitarPaso(i)}
              disabled={form.pasos.length <= 1}
            >
              Quitar
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-secondary" onClick={agregarPaso}>
          + Añadir paso
        </button>
      </fieldset>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy
            ? 'Guardando…'
            : modo === 'crear'
              ? rol === 'agente'
                ? 'Enviar a validación'
                : 'Crear proceso'
              : 'Guardar cambios'}
        </button>
      </div>

      {rol === 'agente' && modo === 'crear' && (
        <p className="form-hint">
          Como agente, tu propuesta queda en borrador: un editor la valida y la publica. Antes de eso no aparece en el
          portal.
        </p>
      )}
    </form>
  );
}
