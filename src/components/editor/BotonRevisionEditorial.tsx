/* ============================================================
   Botón "Revisión editorial" — Portal Capacitación RR / AS400
   Solo editor/admin. El rol lo resuelve en el CLIENTE con
   useSession: si se leyera la cookie en el servidor, /procesos
   dejaría de ser ISR (ver use-session.ts). Mientras carga o sin
   sesión no se pinta nada, igual que BotonGestionarEnlaces.
   Lleva a la cola de validación (/editor/revision).
   ============================================================ */
'use client';

import Link from 'next/link';
import { useSession } from '@/lib/use-session';
import { puedeValidarProcesos, normalizarRol } from '@/lib/roles';

export function BotonRevisionEditorial() {
  const { session } = useSession();

  if (!session || !puedeValidarProcesos(normalizarRol(session.role))) return null;

  return (
    <Link href="/editor/revision" className="btn btn-secondary">
      ☑ Revisión editorial
    </Link>
  );
}
