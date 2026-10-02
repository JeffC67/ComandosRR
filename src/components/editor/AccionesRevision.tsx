/* ============================================================
   Acciones de la cola de revisión — Portal Capacitación RR / AS400
   Validar y publicar, corregir (editar) o eliminar.
   ============================================================ */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function AccionesRevision({ id, slug, publicado = false }: { id: string; slug: string; publicado?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const llamar = async (url: string, method: string) => {
    setBusy(method + url);
    setError('');
    try {
      const res = await fetch(url, { method });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error ?? `${method} → ${res.status}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const validar = () => llamar(`/api/procesos/${encodeURIComponent(id)}/validar`, 'POST');
  const eliminar = async () => {
    if (!confirm('¿Eliminar este proceso y sus pasos? No se puede deshacer.')) return;
    await llamar(`/api/procesos/${encodeURIComponent(id)}`, 'DELETE');
  };

  return (
    <div className="review-actions">
      {!publicado && (
        <button type="button" className="btn btn-primary" onClick={validar} disabled={busy !== null}>
          {busy ? '…' : '✅ Validar y publicar'}
        </button>
      )}
      <Link href={`/procesos/${slug}/editar`} className="btn btn-secondary">
        ✏️ Corregir
      </Link>
      <button type="button" className="btn btn-danger" onClick={eliminar} disabled={busy !== null}>
        {busy ? '…' : '🗑 Eliminar'}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
