/* ============================================================
   Middleware — Portal Capacitación RR / AS400
   Sin rol visitante: todo el portal exige login.
   Solo 3 roles: agente, editor, admin.
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

/* Rutas que NO exigen sesión (el resto sí: sin visitante) */
function esPublica(pathname: string): boolean {
  return (
    pathname === '/login' ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/og-image.svg'
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (esPublica(pathname)) {
    // Con sesión, /login sobra: al inicio
    if (pathname === '/login') {
      const accessToken = request.cookies.get('access_token')?.value;
      if (accessToken && (await verifyTokenEdge(accessToken))) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    return NextResponse.next();
  }

  // /api/revalidate se protege con su propio secreto, no con sesión
  if (pathname.startsWith('/api/revalidate')) return NextResponse.next();

  // Todo lo demás (páginas, /api/procesos, /api/pasos…)
  // exige sesión: sin visitante
  const accessToken = request.cookies.get('access_token')?.value;
  const session = accessToken ? await verifyTokenEdge(accessToken) : null;

  if (!session) {
    // Las API responden 401; las páginas redirigen al login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Cola de validación: solo editor/admin (el agente propone, no valida)
  if (pathname.startsWith('/editor') && session.role !== 'editor' && session.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
