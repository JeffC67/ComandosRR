/* ============================================================
   API: Logout — Portal Capacitación RR / AS400
   ============================================================ */

import { NextResponse } from 'next/server';
import { cookieOptions } from '@/lib/auth';

/* Las cookies solo se borran de verdad si se expiran con LOS MISMOS
   atributos con los que se crearon (path, sameSite, secure): un
   `delete` sin atributos no siempre las pisa en el navegador. */
function expirarCookies(response: NextResponse): NextResponse {
  response.cookies.set('access_token', '', { ...cookieOptions(), maxAge: 0 });
  response.cookies.set('refresh_token', '', { ...cookieOptions(), maxAge: 0 });
  return response;
}

export async function POST() {
  /* Solo se borran las cookies nuestras. Antes se llamaba además a
     directusLogout(getRefreshToken()), pero esa cookie es un JWT del
     portal y no el refresh_token de Directus, así que la llamada a
     /auth/logout siempre era un error silencioso. */
  return expirarCookies(NextResponse.json({ success: true }));
}

/* GET también cierra sesión y redirige al login: así ni la navegación
   directa (ni un enlace viejo) deja una página en blanco con un 405. */
export async function GET(request: Request) {
  const login = new URL('/login', request.url);
  return expirarCookies(NextResponse.redirect(login));
}
