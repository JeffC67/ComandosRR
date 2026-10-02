/* ============================================================
   Formulario de enlace — Portal Capacitación RR / AS400
   Lo usan /editor/enlaces/nuevo (crear) y
   /editor/enlaces/[id]/editar (corregir). Solo editor/admin
   llegan aquí (la página y la API lo exigen). Usa .form-* de
   globals.css, igual que FormularioProceso.
   Categoría y grupo son desplegables con los valores que ya
   existen (más opción "Nueva…" con campo de texto). El orden ya
   no se edita aquí: al crear va 0 y al editar se conserva el
   que trae la fila (vive en Directus/panel si hay que afinarlo).
   ============================================================ */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { EnlaceFormInicial } from '@/lib/enlaces-form';

/* Valor centinela del desplegable: "escribir una nueva". */
const NUEVA = '__nueva__';

export function FormularioEnlace({
  inicial,
  modo,
  enlaceId,
  categorias,
  gruposPorCategoria,
}: {
  inicial: EnlaceFormInicial;
  modo: 'crear' | 'editar';
  enlaceId?: string;
  categorias: string[];
  gruposPorCategoria: Record<string, string[]>;
}) {
  const router = useRouter();
  const [form, setForm] = useState(inicial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const catInicial = inicial.categoria && categorias.includes(inicial.categoria) ? inicial.categoria : NUEVA;
  const [catSel, setCatSel] = useState(catInicial);
  const [catTexto, setCatTexto] = useState(catInicial === NUEVA ? inicial.categoria : '');

  const gruposCat = catSel === NUEVA ? [] : (gruposPorCategoria[catSel] ?? []);
  const grupoInicial =
    inicial.grupo && gruposCat.includes(inicial.grupo) ? inicial.grupo : catSel === NUEVA ? NUEVA : '';
  const [grupoSel, setGrupoSel] = useState(grupoInicial);
  const [grupoTexto, setGrupoTexto] = useState(grupoInicial === NUEVA ? inicial.grupo : '');

  const set = (k: keyof EnlaceFormInicial) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const elegirCategoria = (v: string) => {
    setCatSel(v);
    setGrupoSel('');
    setGrupoTexto('');
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const categoria = catSel === NUEVA ? catTexto.trim() : catSel;
      const grupo = catSel === NUEVA ? grupoTexto.trim() : grupoSel === NUEVA ? grupoTexto.trim() : grupoSel;
      if (!categoria) throw new Error('La categoría es obligatoria');
      if (!grupo) throw new Error('El grupo es obligatorio');
      if (!form.nombre.trim()) throw new Error('El nombre es obligatorio');

      const body: Record<string, unknown> = {
        categoria,
        grupo,
        nombre: form.nombre,
        url: form.url,
        descripcion: form.descripcion,
        estado: form.estado,
      };
      /* Sin campo de orden: al crear va 0; al editar se conserva el actual. */
      if (modo === 'crear') body.orden = 0;

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
        <select value={catSel} onChange={(e) => elegirCategoria(e.target.value)} required>
          <option value="">Elige una categoría…</option>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          <option value={NUEVA}>＋ Nueva categoría…</option>
        </select>
      </label>
      {catSel === NUEVA && (
        <label className="form-field">
          <span>Nueva categoría *</span>
          <input
            value={catTexto}
            onChange={(e) => setCatTexto(e.target.value)}
            required
            maxLength={60}
            placeholder="INDRA, HOGAR, MÓVIL…"
          />
        </label>
      )}

      {catSel === NUEVA ? (
        <label className="form-field">
          <span>Grupo *</span>
          <input
            value={grupoTexto}
            onChange={(e) => setGrupoTexto(e.target.value)}
            required
            maxLength={120}
            placeholder="SOPORTE HOGAR…"
          />
        </label>
      ) : (
        <>
          <label className="form-field">
            <span>Grupo *</span>
            <select value={grupoSel} onChange={(e) => setGrupoSel(e.target.value)} required>
              <option value="">Elige un grupo…</option>
              {gruposCat.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
              <option value={NUEVA}>＋ Nuevo grupo…</option>
            </select>
          </label>
          {grupoSel === NUEVA && (
            <label className="form-field">
              <span>Nuevo grupo *</span>
              <input
                value={grupoTexto}
                onChange={(e) => setGrupoTexto(e.target.value)}
                required
                maxLength={120}
                placeholder="SOPORTE HOGAR…"
              />
            </label>
          )}
        </>
      )}

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

      <label className="form-field">
        <span>Estado</span>
        <select value={form.estado} onChange={(e) => set('estado')(e.target.value)}>
          <option value="publicado">Publicado</option>
          <option value="borrador">Borrador</option>
          <option value="archivado">Archivado</option>
        </select>
      </label>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Guardando…' : modo === 'crear' ? 'Crear enlace' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
