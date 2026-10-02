# Seed — Portal Capacitación RR / AS400

Restauración completa del backend en **cualquier Directus vacío** (u otro
entorno: staging, nuevo Render, local) a partir de ficheros JSON
versionados. No depende de `scripts/`: esta carpeta es autocontenida
(solo necesita `node`, sin dependencias).

## Qué contiene

| Fichero | Origen | Contenido |
|---|---|---|
| `schema.json` | `extract.mjs` ← Directus | metadata de las 7 colecciones, campos y 5 relaciones |
| `data/*.json` | `extract.mjs` ← Directus | 4 módulos, 28 comandos, 3 categorías, 12 procesos, 111 pasos, 2 videos, 55 enlaces |
| `access.json` | `extract.mjs` ← Directus | roles (agente, Editor, Portal), policies, 49 permisos, vínculos y usuarios |
| `extract.mjs` | — | vuelca un Directus a estos JSON (solo lee, no escribe) |
| `restore.mjs` | — | aplica los JSON a un Directus destino (idempotente) |

Lo que **NO** incluye (a propósito):

- **Contraseñas**: jamás se extraen (Directus solo devuelve hashes). Al
  restaurar, la cuenta de servicio toma `DIRECTUS_SERVICE_PASSWORD` del
  entorno; `editor@` y `agente.prueba@` usan las de prueba documentadas
  (solo al crearlos; nunca se cambia la de uno existente).
- **Usuarios admin/externos** (`jeffc1125…`, `lexnardx06…`): se listan en
  `access.json` como referencia, pero no se crean (cada entorno tiene su
  propio admin).
- **Videos MP4**: `videos.archivo` es el nombre del fichero; los MP4 viven
  en `public/media/` del frontend (repo), no en Directus.

## Restaurar en otro lado (desde cero)

1. Levanta un Directus 12 vacío (da igual dónde: Render, Docker, VPS)
   con su admin creado.
2. Desde la raíz del repo:
   ```bash
   DIRECTUS_URL=https://nuevo-directus.onrender.com \
   DIRECTUS_ADMIN_EMAIL=admin@... \
   DIRECTUS_ADMIN_PASSWORD=... \
   DIRECTUS_SERVICE_PASSWORD=$(openssl rand -hex 24) \
   node seed/restore.mjs
   ```
   Sin `DIRECTUS_URL` usa el `.env` de la raíz (local `http://127.0.0.1:8056`).
3. Listo: esquema, contenido, roles, permisos y cuentas quedan idénticos.
   Guarda el `DIRECTUS_SERVICE_PASSWORD` generado: es el que usa el
   frontend (`Vercel → Environment Variables`).

- Re-ejecutar es seguro: casa cada fila por **clave natural** (slug,
  `(módulo,etiqueta)`, `(proceso,orden)`, `archivo`,
  `(categoría,grupo,nombre)`) y solo crea/actualiza lo distinto.
- `--force` vacía primero las tablas de contenido (hijos antes que
  padres, borrado permanente) y reinserta. El esquema y el acceso nunca
  se borran, solo se aseguran.
- Los IDs **no** se copian: las FK se reescriben a los IDs nuevos, así
  que nunca hay choques de secuencias en Postgres.

## Re-extraer (actualizar la seed tras cambios en producción)

```bash
DIRECTUS_URL=... DIRECTUS_ADMIN_EMAIL=... DIRECTUS_ADMIN_PASSWORD=... \
node seed/extract.mjs
```

Sobrescribe `schema.json`, `data/` y `access.json`. Revisa el `git diff`
antes de commitear: es el cambio real del contenido.

## Claves naturales (cómo casa cada colección)

`modulos.slug`, `categorias.slug`, `procesos.slug`,
`comandos(modulo,etiqueta)`, `pasos(proceso,orden)`, `videos.archivo`,
`enlaces(categoria,grupo,nombre)`.
