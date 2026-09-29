# Portal de Capacitación RR / AS400

Sitio de capacitación para agentes de call center que usan el sistema **RR / AS400**: comandos
de búsqueda, gestión de suscriptores, consultas especiales y procesos guiados paso a paso.

Arquitectura del **`plan.md`**: **Next.js (App Router) + Directus + PostgreSQL** dentro de la red
interna, publicada tras **Caddy** (proxy reverso + TLS).

```
Red interna:  portal.rr.local ──► Caddy ──► Next.js :3000  ·  Directus :8055  ·  PostgreSQL
                                                        └── API REST ──┘
```

---

## Arranque rápido

```bash
npm install            # dependencias
npm run dev            # desarrollo en http://localhost:3000
npm run build          # build de producción
npm run start          # sirve el build de producción
npm run lint           # ESLint
npx tsc --noEmit       # type-check
```

### Stack Docker (Directus + Postgres + Caddy)

```bash
docker compose up -d          # levanta los 3 servicios (caddy, directus, postgres)
npm run migrate               # carga src/data/*.json en Directus (aborta si ya hay datos)
npm run migrate:force         # borra y vuelve a migrar
npm run verify                # compara Directus contra src/data → "VERIFICACIÓN PASADA"
```

Operación detallada (arranque, backup, restore, primer despliegue): **`infra/README.md`**.

---

## Estructura

```
ComandosRR/
├── src/
│   ├── app/                    # App Router (Fase 2)
│   │   ├── layout.tsx          # html, fuentes, navbar, footer, CSS global
│   │   ├── page.tsx            # /            → hero + métricas + módulos
│   │   ├── busqueda/page.tsx   # /busqueda
│   │   ├── suscriptor/page.tsx # /suscriptor
│   │   ├── consultas/page.tsx  # /consultas
│   │   ├── procesos/page.tsx   # /procesos
│   │   ├── procesos/[slug]/…   # /procesos/[slug] → pasos (reemplaza los modales)
│   │   └── tutoriales/page.tsx # /tutoriales
│   ├── components/
│   │   ├── layout/             # Navbar, Footer
│   │   ├── modules/            # Hero, ModuleSection, CommandCard, VideoCard
│   │   ├── processes/          # ProcessCard, StepList (Anterior/Siguiente)
│   │   └── ui/                 # Button, Icons, SectionDivider
│   ├── lib/
│   │   ├── directus.ts         # cliente Directus (SDK) + queries + ISR
│   │   └── utils.ts
│   ├── types/index.ts          # tipos de la API de Directus
│   └── styles/globals.css      # design tokens + reset + utilidades
│
├── src/data/                   # ← FUENTE DE VERDAD del contenido (Fase 1)
│   ├── modulos.json            # 4 módulos (slug, layout, orden)
│   ├── comandos.json           # 28 comandos (etiqueta, tecla, tipo, icono)
│   ├── procesos.json           # 3 procesos con sus 30 pasos (HTML)
│   ├── videos.json             # 2 tutoriales
│   └── hero.json               # textos del hero
│
├── scripts/                    # utilidades de la Fase 1
│   ├── migrate.mjs             # src/data/*.json → Directus
│   ├── verify.mjs              # Directus vs. src/data (28 comprobaciones)
│   └── setup-access.mjs        # roles y políticas
├── directus/                   # snapshot del schema
├── infra/                      # Caddy, backups (backup.sh / restore.sh), README
└── docker-compose.yml          # caddy + directus + postgres + volumen de uploads
```

---

## Cómo editar el contenido

| Quiero… | Dónde |
|---|---|
| Editar en el panel (editores) | Directus → `portal.rr.local/admin` (rol `editor`) |
| Editar en el repo (devs) | `src/data/*.json` y luego `npm run migrate:force` |
| Agregar un comando | `src/data/comandos.json` (`tipo`: `basico` \| `avanzado`) |
| Editar los pasos de un proceso | `src/data/procesos.json` → `modal.bloques[].items[]` (HTML) |
| Cambiar orden/layout de una sección | `src/data/modulos.json` |

`npm run verify` comprueba que Directus y `src/data/` estén 1:1 (conteos, orden, slugs,
contenido de pasos, videos con Range 206, borradores ocultos y anónimos sin acceso).

---

## Estado de las fases (`plan.md`)

| Fase | Estado |
|---|---|
| 0 — Infraestructura Docker | ✅ caddy + directus + postgres healthy; backups probados |
| 1 — Schema + migración del contenido | ✅ `npm run verify` → **VERIFICACIÓN PASADA (28/28)** |
| 2 — Frontend Next.js por secciones | 🔄 en curso (ver `plan.md` para el detalle y los checks pendientes) |
| 3 — Auth, progreso y quiz | ⬜ pendiente |
| 4 — Pulido, docs y producción | ⬜ pendiente |
