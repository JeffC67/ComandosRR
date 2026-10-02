/* ============================================================
   API: Sesión actual — GET /api/auth/me
   ------------------------------------------------------------
   Devuelve `{ session: { email, role } }` o `{ session: null }`.

   Existe para que el Navbar (y las acciones de rol) puedan saber
   quién está conectado SIN que el render del servidor lea
   `cookies()`: leerla en el layout dinamizaba toda la app y
   desactivaba el ISR. La cookie sigue siendo httpOnly y la firma
   sigue verificándola el servidor aquí.
   ============================================================ */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

/* El resultado depende de la cookie: jamás debe quedar cacheado. */
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();

  return NextResponse.json(session ? { session: { email: session.email, role: session.role } } : { session: null }, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
