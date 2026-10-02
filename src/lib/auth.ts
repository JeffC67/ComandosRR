/* ============================================================
   Auth Library — Portal Capacitación RR / AS400
   JWT en cookies httpOnly + secure
   ============================================================ */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { AuthUser, JWTPayload, LoginResponse } from '@/types/auth';
import { directusUrl } from '@/lib/directus-url';

/* Sin secreto no hay sesión: mejor que la app falle al arrancar que
   firmar con un secreto publicado en el repositorio. */
const RAW_SECRET = process.env.JWT_SECRET;
if (!RAW_SECRET || RAW_SECRET.length < 32) {
  throw new Error(
    'JWT_SECRET no está definido (o tiene menos de 32 caracteres). ' +
      'Genéralo con `openssl rand -hex 32` y ponlo en .env.local.',
  );
}
const JWT_SECRET = new TextEncoder().encode(RAW_SECRET);

const JWT_EXPIRY = '8h';
const REFRESH_EXPIRY = '7d';

/* ---------- Cookie options ----------
   `secure` no puede salir de NODE_ENV: el build siempre es
   "production", así que la cookie quedaba marcada como secure aunque
   el sitio se sirviera por HTTP, y el login «funcionaba» pero no
   llegaba a la siguiente petición. Depende de cómo se publique: con el
   Caddy de HTTPS delante es true (el valor por defecto), y
   COOKIE_SECURE=false para despliegues sin TLS. */
const cookieSecure = () =>
  process.env.COOKIE_SECURE === 'false'
    ? false
    : process.env.COOKIE_SECURE === 'true'
      ? true
      : process.env.NODE_ENV === 'production';

/* Exportado para que las rutas de login/logout fijen las cookies sobre
   su propio NextResponse con exactamente los mismos atributos. */
export const cookieOptions = () => ({
  httpOnly: true,
  secure: cookieSecure(),
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 8, // 8 horas
});

/* ---------- Create tokens ---------- */
export async function createAccessToken(user: AuthUser): Promise<string> {
  return new SignJWT({ sub: user.id, email: user.email, role: user.role || 'agente' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
}

export async function createRefreshToken(user: AuthUser): Promise<string> {
  return new SignJWT({ sub: user.id, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_EXPIRY)
    .sign(JWT_SECRET);
}

/* ---------- Verify token ---------- */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/* ---------- Cookie management ----------
   Son funciones de AGENTE DE LECTURA: se usan desde los Server
   Components. NO escriben cookies, solo leen. Escribirlo desde una
   página es un error de Next.js ("Cookies can only be modified in a
   Server Action or Route Handler"); la escritura vive en las rutas
   /api/auth/*, sobre su propio NextResponse. */
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('access_token')?.value || null;
}

/* ---------- Server-side auth ---------- */
export async function getSession(): Promise<JWTPayload | null> {
  const token = await getAccessToken();
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(): Promise<JWTPayload> {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}

export async function requireRole(allowedRoles: string[]): Promise<JWTPayload> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    redirect('/login');
  }
  return session;
}

/* ---------- Directus Auth API ---------- */
const DIRECTUS_URL = directusUrl();

/* Los roles de Directus (Administrator, Editor, Portal, agente…) a los
   tres que entiende el portal. `role.name` solo se puede leer si la
   política del usuario lo permite; si no, todo cae en `agente`.
   Portal es cuenta de servicio: se marca aparte para rechazarla en el
   login (nunca entra por la UI). */
const mapRol = (rol?: string | null): string => {
  const n = (rol || '').toLowerCase();
  if (n.startsWith('admin')) return 'admin';
  if (n.startsWith('editor')) return 'editor';
  if (n.startsWith('portal')) return 'portal';
  return 'agente';
};

export async function directusLogin(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.errors?.[0]?.message || 'Credenciales inválidas');
  }

  const accessToken = data.data.access_token as string;

  /* Directus 12 ya NO devuelve `user` en /auth/login (solo `expires`,
     `refresh_token` y `access_token`) y `/users/me` sin `fields` devuelve
     únicamente `id`. Sin `id` el JWT se emite sin `sub` y las rutas que
     filtran por agente (quiz) no podrían identificar al usuario. */
  const meRes = await fetch(`${DIRECTUS_URL}/users/me?fields=id,email,first_name,last_name,role.name`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const me = (meRes.ok ? ((await meRes.json()).data ?? {}) : {}) as Record<string, unknown> & {
    role?: { name?: string } | string | null;
  };

  const id = (me.id as string) ?? data.data.user?.id;
  if (!id) throw new Error('Directus no devolvió el id del usuario: no se puede crear la sesión');

  const rolDirectus = typeof me.role === 'object' && me.role ? me.role.name : null;

  return {
    user: {
      id,
      // La política "Portal" no deja leer el email propio: usamos el que
      // acaba de escribir el usuario.
      email: (me.email as string) ?? email,
      first_name: (me.first_name as string) ?? null,
      last_name: (me.last_name as string) ?? null,
      role: mapRol(rolDirectus),
    },
    access_token: accessToken,
    refresh_token: data.data.refresh_token,
    expires: data.data.expires,
  };
}

/* No existe un `directusLogout` que llamar desde /api/auth/logout: la
   cookie que guarda el portal es un JWT NUESTRO (createRefreshToken),
   no el refresh_token de Directus, así que `/auth/logout` lo rechazaba
   y el `catch` se lo tragaba. La llamada nunca hizo nada. La sesión de
   Directus que abre el login la revoca su TTL
   (DIRECTUS_REFRESH_TOKEN_TTL). */
