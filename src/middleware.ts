/* ============================================================
   Middleware — Portal Capacitación RR / AS400
   Protege rutas que requieren autenticación
   Edge Runtime compatible (sin Node.js APIs)
   ============================================================ */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
/* Se importa el subpath `jose/jwt/verify` (y no la raíz `jose`): el
   barrel incluye JWE/decryption, que usa APIs no soportadas en el Edge
   Runtime y hace que el build avise. */
import { jwtVerify } from 'jose/jwt/verify';

/* Verificación real de la firma. Antes se limitaba a decodificar el
   payload con `atob` y comprobar `exp`: cualquiera podía fabricar un
   token con el formato correcto. Con secreto ausente o erróneo,
   jwtVerify lanza y la ruta cae a "sin sesión" (fallo cerrado). */
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? '');

async function verifyTokenEdge(token: string): Promise<{ sub: string; email: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.sub) return null;
    return {
      sub: String(payload.sub),
      email: String(payload.email ?? ''),
      role: String(payload.role ?? ''),
    };
  } catch {
    return null;
  }
}

const PROTECTED_PATHS = ['/mi-progreso', '/quiz'];
const AUTH_PATHS = ['/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar si la ruta está protegida
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  const isAuthPage = AUTH_PATHS.some((path) => pathname.startsWith(path));

  // Obtener token de la cookie
  const accessToken = request.cookies.get('access_token')?.value;

  let session = null;
  if (accessToken) {
    session = await verifyTokenEdge(accessToken);
  }

  // Si está en página de auth y ya tiene sesión, redirigir a mi-progreso
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/mi-progreso', request.url));
  }

  // Si ruta protegida y no hay sesión, redirigir a login
  if (isProtected && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/mi-progreso/:path*',
    '/quiz/:path*',
    '/login',
  ],
};