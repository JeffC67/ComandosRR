/* ============================================================
   useSession — sesión leída en el CLIENTE
   ------------------------------------------------------------
   Antes la sesión (`cookies()`) se leía en el layout raíz, y eso
   dinamizaba TODA la aplicación: Next no podía generar ninguna
   página como estática y el ISR (`revalidate = 60`) no se aplicaba
   en ningún sitio (todas las rutas salían `ƒ` con
   `Cache-Control: no-store`).

   La cookie sigue siendo httpOnly y la sigue verificando el
   servidor: aquí solo se pide `GET /api/auth/me`, que devuelve el
   email y el rol ya validados. El render del HTML deja de depender
   de la sesión y las páginas vuelven a poder cachearse.

   `avisarCambioSesion()` se llama tras iniciar o cerrar sesión para
   refrescar el menú sin recargar (el layout no se desmonta al
   navegar con `router.push`).
   ============================================================ */

'use client';

import { useCallback, useEffect, useState } from 'react';

export interface Sesion {
  email: string;
  role: string;
}

const EVENTO = 'rr:sesion-cambiada';

/** Avisa de que la cookie de sesión ha cambiado (login/logout). */
export function avisarCambioSesion(): void {
  window.dispatchEvent(new Event(EVENTO));
}

/**
 * `session` es `undefined` mientras carga, `null` sin sesión y objeto
 * con sesión. Trata `undefined` como sin sesión a la hora de pintar
 * (el menú de usuario aparece en cuanto responde, sin saltos de
 * layout añadidos).
 */
export function useSession(): { session: Sesion | null } {
  const [session, setSession] = useState<Sesion | null>(null);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!res.ok) {
        setSession(null);
        return;
      }
      const data: { session?: Sesion | null } = await res.json();
      setSession(data.session ?? null);
    } catch {
      /* sin red o sin cookie: se muestra como desconectado */
      setSession(null);
    }
  }, []);

  useEffect(() => {
    cargar();
    window.addEventListener(EVENTO, cargar);
    return () => window.removeEventListener(EVENTO, cargar);
  }, [cargar]);

  return { session };
}
