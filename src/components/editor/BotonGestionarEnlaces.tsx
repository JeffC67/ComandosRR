/* ============================================================
   Botón "Gestionar enlaces" — Portal Capacitación RR / AS400
   Solo editor/admin. El rol lo resuelve en el CLIENTE con
   useSession: si se leyera la cookie en el servidor, /aplicaciones
   dejaría de ser ISR (ver use-session.ts). Mientras carga o sin
   sesión no se pinta nada, igual que AccionesProceso.
   ============================================================ */
'use client';

import Link from 'next/link';
import { useSession } from '@/lib/use-session';
import { puedeEditarEnlaces, normalizarRol } from '@/lib/roles';

export function BotonGestionarEnlaces() {
  const { session } = useSession();

  if (!session || !puedeEditarEnlaces(normalizarRol(session.role))) return null;

  return (
    <Link href="/editor/enlaces" className="btn btn-primary">
      ✎ Gestionar enlaces
    </Link>
  );
}
