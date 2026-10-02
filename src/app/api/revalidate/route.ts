/* ============================================================
   API: Revalidate — invalidación on-demand del ISR
   ------------------------------------------------------------
   La alberca de páginas se cachea 60s (`export const revalidate`),
   pero cuando un editor publica contenido en Directus no tiene por
   qué esperar: Directus llama a esta ruta y el portal se refresca
   en la siguiente petición.

   Protección: secreto compartido `REVALIDATE_SECRET`, que viaja o
   bien en la cabecera `x-revalidate-secret` o bien en el cuerpo
   `{"secret": "..."}`. La comparación es de tiempo constante para
   no filtrar el secreto por timing.

   Uso:
     curl -X POST https://portal/api/revalidate \
       -H 'content-type: application/json' \
       -H 'x-revalidate-secret: <secreto>' \
       -d '{"paths": ["/procesos"]}'

   Sin `paths` se invalidan todas las rutas de contenido.
   ============================================================ */

import { timingSafeEqual } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

/* Nota: el quiz y el editor son dinámicos por diseño
   (dependen de la sesión): no cachean y la revalidación no les afecta. */

/* Comparación en tiempo constante: `a === b` por strings corta en el
   primer byte distinto y un atacante podría medirlo. */
function coincide(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export async function POST(request: NextRequest) {
  const esperado = process.env.REVALIDATE_SECRET;

  if (!esperado) {
    return NextResponse.json({ revalidated: false, error: 'REVALIDATE_SECRET no está configurado' }, { status: 503 });
  }

  let body: { secret?: unknown; paths?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    /* cuerpo vacío o no JSON: también sirve solo la cabecera */
  }

  const recibido = request.headers.get('x-revalidate-secret') ?? body.secret;
  if (typeof recibido !== 'string' || !coincide(recibido, esperado)) {
    return NextResponse.json({ revalidated: false, error: 'secreto inválido' }, { status: 401 });
  }

  const pedido =
    Array.isArray(body.paths) && body.paths.length > 0
      ? body.paths.filter((p): p is string => typeof p === 'string').map(normalizaRuta)
      : null;

  if (pedido !== null && pedido.length === 0) {
    return NextResponse.json({ revalidated: false, error: 'paths no contiene rutas' }, { status: 400 });
  }

  if (pedido === null) {
    /* Sin `paths`: se invalida el layout raíz y con él TODAS las páginas
       que cuelgan de él, incluidos los detalles `/procesos/[slug]`
       (que un `paths` genérico nunca podría enumerar). Las rutas
       dinámicas (quiz, editor) no cachean: no les afecta. */
    revalidatePath('/', 'layout');
  } else {
    for (const ruta of pedido) revalidatePath(ruta);
  }

  return NextResponse.json({
    revalidated: true,
    paths: pedido ?? ['/ (layout: todo el portal)'],
    at: new Date().toISOString(),
  });
}

/* Solo rutas internas: nunca revalidar una URL externa que haya
   colado alguien en `paths`. */
function normalizaRuta(ruta: string): string {
  if (ruta === '') return '/';
  if (!ruta.startsWith('/') || ruta.startsWith('//')) return '/';
  return ruta.split('?')[0].split('#')[0];
}

export async function GET() {
  return NextResponse.json({ error: 'usa POST' }, { status: 405, headers: { allow: 'POST' } });
}
