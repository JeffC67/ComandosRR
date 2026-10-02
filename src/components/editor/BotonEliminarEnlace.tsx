/* ============================================================
   Eliminar enlace — botón con confirmación (igual que las
   acciones de revisión: fetch DELETE + router.refresh).
   ============================================================ */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function BotonEliminarEnlace({ id, nombre }: { id: string; nombre: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const eliminar = async () => {
    if (!confirm(`¿Eliminar el enlace "${nombre}"? No se puede deshacer.`)) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/enlaces/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error ?? `Eliminar → ${res.status}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" className="btn btn-danger" onClick={eliminar} disabled={busy}>
        {busy ? 'Eliminando…' : '🗑 Eliminar'}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
