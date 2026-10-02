/* ============================================================
   API: Login — Portal Capacitación RR / AS400
   ============================================================ */

import { NextRequest, NextResponse } from 'next/server';
import { directusLogin, createAccessToken, createRefreshToken, cookieOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
    }

    const { user } = await directusLogin(email, password);

    // Solo 3 roles de usuario. La cuenta de servicio Portal es interna
    // (Next.js ↔ Directus) y nunca entra por el login del portal.
    if (user.email === process.env.DIRECTUS_SERVICE_EMAIL) {
      return NextResponse.json({ error: 'Cuenta no válida para este login' }, { status: 403 });
    }
    if (user.role !== 'agente' && user.role !== 'admin' && user.role !== 'editor') {
      return NextResponse.json({ error: 'No tienes permisos para acceder' }, { status: 403 });
    }

    // Crear tokens JWT propios
    const accessToken = await createAccessToken(user);
    const refreshToken = await createRefreshToken(user);

    /* Respuesta mínima: el cliente solo necesita saber que entró (el
       resto —email, rol— lo pide a /api/auth/me). No se devuelven
       tokens ni ids en el cuerpo: viajan solo en cookies httpOnly. */
    const response = NextResponse.json({ ok: true });

    /* Las cookies se fijan UNA sola vez, sobre la respuesta que se
       devuelve, y con los mismos atributos que el resto del portal
       (cookieOptions decide si llevan `Secure`: fijarlo con NODE_ENV
       hacía que el login no persistiera sobre HTTP). */
    response.cookies.set('access_token', accessToken, cookieOptions());
    response.cookies.set('refresh_token', refreshToken, {
      ...cookieOptions(),
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al iniciar sesión' },
      { status: 401 },
    );
  }
}
