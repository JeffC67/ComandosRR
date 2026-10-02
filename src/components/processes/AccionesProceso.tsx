/* ============================================================
   Acciones de proceso según rol — Portal Capacitación RR / AS400
   · editor/admin: Editar, Validar y publicar, Eliminar.
   · agente: sin acciones sobre publicados (propone en /procesos/nuevo).
   ============================================================ */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/use-session';

export function AccionesProceso({ id, slug }: { id: string; slug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'validar' | 'eliminar' | null>(null);
  const [error, setError] = useState('');

  /* El rol lo resuelve el cliente: si se leyera la sesión en el
     servidor la página dejaría de ser ISR (ver use-session.ts).
     Mientras carga o sin sesión no se pinta nada, igual que antes. */
  const { session } = useSession();
  const rol: 'agente' | 'editor' | 'admin' =
    session?.role === 'admin' || session?.role === 'editor' ? session.role : 'agente';

  if (!session || rol === 'agente') return null;

  const validar = async () => {
    setBusy('validar');
    setError('');
    try {
      const res = await fetch(`/api/procesos/${encodeURIComponent(id)}/validar`, { method: 'POST' });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error ?? `Validar → ${res.status}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const eliminar = async () => {
    if (!confirm('¿Eliminar este proceso y sus pasos? No se puede deshacer.')) return;
    setBusy('eliminar');
    setError('');
    try {
      const res = await fetch(`/api/procesos/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error ?? `Eliminar → ${res.status}`);
      router.push('/procesos');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(null);
    }
  };

  return (
    <div className="detail-actions" role="group" aria-label="Administración del proceso">
      <Link href={`/procesos/${slug}/editar`} className="btn btn-secondary">
        ✏️ Editar
      </Link>
      <button type="button" className="btn btn-primary" onClick={validar} disabled={busy !== null}>
        {busy === 'validar' ? 'Publicando…' : '✅ Validar y publicar'}
      </button>
      <button type="button" className="btn btn-danger" onClick={eliminar} disabled={busy !== null}>
        {busy === 'eliminar' ? 'Eliminando…' : '🗑 Eliminar'}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
