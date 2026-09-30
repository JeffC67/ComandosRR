/* ============================================================
   API: Logout — Portal Capacitación RR / AS400
   ============================================================ */

import { NextResponse } from 'next/server';

export async function POST() {
  /* Solo se borran las cookies nuestras. Antes se llamaba además a
     directusLogout(getRefreshToken()), pero esa cookie es un JWT del
     portal y no el refresh_token de Directus, así que la llamada a
     /auth/logout siempre era un error silencioso. */
  const response = NextResponse.json({ success: true });
  response.cookies.delete('access_token');
  response.cookies.delete('refresh_token');

  return response;
}