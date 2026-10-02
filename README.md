# Portal Capacitación RR / AS400

Plataforma de capacitación para agentes de call center que utilizan el sistema RR/AS400. Construida con **Next.js 15**, **Directus** (CMS headless) y **PostgreSQL**, desplegada on-premise con **Docker Compose** y **Caddy** (TLS interno).

---

## 📋 Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Requisitos](#requisitos)
- [Instalación Rápida](#instalación-rápida)
- [Configuración](#configuración)
- [Operación Diaria](#operación-diaria)
- [Backup y Restore](#backup-y-restore)
- [Actualizaciones](#actualizaciones)
- [Troubleshooting](#troubleshooting)
- [Estructura del Proyecto](#estructura-del-proyecto)

---

## 🏗 Arquitectura

```
Red interna de la empresa
  DNS: portal.rr.local ──► Caddy (proxy reverso + TLS interno)
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
        Next.js :3000      Directus :8055      Videos (volumen)
        (Frontend)         (CMS/API)           Docker
              │                 │
              └─────── API REST ┘
                            ▼
                     PostgreSQL (volumen)
```

**Stack:**
- **Frontend:** Next.js 15 (App Router, React 18, TypeScript)
- **CMS/API:** Directus (self-hosted, Docker)
- **Base de datos:** PostgreSQL 16 (Docker)
- **Proxy/TLS:** Caddy (certificados internos auto-firmados)
- **Contenedores:** Docker Compose

---

## 📦 Requisitos

### Servidor (mínimos)
- **SO:** Linux (Ubuntu 22.04+, Debian 12+, RHEL 9+)
- **CPU:** 2 vCPU
- **RAM:** ≥ 4 GB (2 GB para servicios + 2 GB SO)
- **Disco:** ≥ 20 GB libres (BD + videos + backups)
- **Puertos:** 80, 443 disponibles
- **Docker:** 24+ / Docker Compose 2+
- **Red:** Acceso DNS interno (`portal.rr.local`)

### Red
- DNS interno: `portal.rr.local` → IP del servidor
- Acceso solo red interna (no expuesto a internet)
- CA empresarial para TLS (o fallback `tls internal` de Caddy)

---

## 🚀 Instalación Rápida

```bash
# 1. Clonar repositorio
git clone <repo-url> ComandosRR
cd ComandosRR

# 2. Configurar entorno
cp .env.example .env
# Editar .env con valores reales (ver sección Configuración)
# Generar secrets: openssl rand -hex 32

# 3. Preparar volumen Directus (permiso para usuario node:1000)
docker volume create comandosrr_directus_data
docker run --rm -v comandosrr_directus_data:/d alpine chown -R 1000:1000 /d

# 4. Levantar stack
docker compose up -d

# 5. Verificar salud
docker compose ps
# Todos los servicios deben mostrar "healthy"

# 6. Crear esquema y permisos en Directus
npm run setup:schema    # colecciones, campos y relaciones (idempotente)
npm run setup:access    # roles, policies y cuentas editor@ / portal@
# El password de la cuenta portal@ se imprime aquí: cópialo a .env.local
# en DIRECTUS_SERVICE_PASSWORD antes de arrancar el frontend.

# 7. Cargar el contenido desde src/data/*.json
npm run migrate:force   # o `npm run migrate` si la base está vacía
npm run verify          # 85 comprobaciones → "VERIFICACIÓN PASADA"

# 8. Arrancar el frontend
npm run dev             # desarrollo, http://localhost:3000
# o bien:
npm run build && npm run start

# 9. Acceder al portal
# https://portal.rr.local (o https://localhost:8443 en local)
```

> **El orden importa:** `setup:schema` → `setup:access` → `migrate` → `verify` → frontend.
> Si `verify` dice que no hay acceso anónimo al contenido o el frontend devuelve
> 403, es que falta `DIRECTUS_SERVICE_PASSWORD` en `.env.local`.

---

## ⚙️ Configuración

### Variables de entorno (`.env`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORTAL_DOMAIN` | Dominio interno del portal | `portal.rr.local` |
| `HTTP_PORT` / `HTTPS_PORT` | Puertos Caddy | `80` / `443` |
| `DIRECTUS_PORT` | Puerto interno Directus | `8055` |
| `POSTGRES_DB` | Nombre BD | `comandosrr` |
| `POSTGRES_USER` | Usuario BD | `directus` |
| `POSTGRES_PASSWORD` | **Password fuerte** | `openssl rand -hex 32` |
| `DIRECTUS_KEY` | **Key de encriptación** | `openssl rand -hex 32` |
| `DIRECTUS_SECRET` | **Secret de firmas** | `openssl rand -hex 32` |
| `DIRECTUS_ADMIN_EMAIL` | Email admin (TLD real) | `admin@empresa.co` |
| `DIRECTUS_ADMIN_PASSWORD` | **Password fuerte** | `openssl rand -hex 16` |
| `DIRECTUS_ACCESS_TOKEN_TTL` | Vida del token de sesión | `1d` |
| `DIRECTUS_REFRESH_TOKEN_TTL` | Vida del token de refresco | `30d` |

### Variables Frontend (`.env.local`)

| Variable | Descripción |
|----------|-------------|
| `DIRECTUS_URL` | URL que usa el **servidor** para hablar con Directus. Se lee en cada petición, no se compila: cámbiala sin `npm run build`. |
| `NEXT_PUBLIC_DIRECTUS_URL` | Solo para lo que llega al navegador. **Se incrusta al compilar**: cambiarla obliga a `npm run build`. Los videos se sirven por el mismo origen (rewrite `/assets`). |
| `DIRECTUS_SERVICE_EMAIL` | Email de la cuenta de servicio |
| `DIRECTUS_SERVICE_PASSWORD` | Password de esa cuenta — la imprime `npm run setup:access` |
| `NEXT_REVALIDATE` | Segundos de caché ISR (default: 60) |
| `JWT_SECRET` | Secret para cookies de auth (min 32 chars) |

> **No hay `DIRECTUS_TOKEN`.** Directus 12 eliminó los tokens estáticos, así que
> no existe una clave fija que pegar en el entorno. El servidor inicia sesión con
> la cuenta de servicio y el SDK renueva la sesión sola (`ACCESS_TOKEN_TTL=1d`).
> Sin `DIRECTUS_SERVICE_PASSWORD`, las páginas de contenido devuelven **403**.

> ⚠️ **No pongas la URL de Directus solo en `NEXT_PUBLIC_*`.** Al compilarse queda
> incrustada en el bundle, así que cambiar de host obligaría a reconstruir. Usa
> `DIRECTUS_URL` para el servidor.

### 🔐 Los tres niveles de acceso

| Nivel | Rol | Puede |
|-------|-----|-------|
| Anónimo | `Public` | Solo `directus_files` (los videos). El contenido se filtra en el servidor. |
| `Portal` | `Portal — solo lectura` | Leer el contenido y registrar el progreso del agente (`progreso`, `quiz_intentos`). Es la cuenta que usa el frontend. No toca el contenido. |
| `Editor` | `Editor de contenido` | CRUD completo en el panel `/admin` de Directus. |

La cuenta de servicio se crea con `npm run setup:access`, que además imprime su
password (solo la primera vez).

### 📜 Scripts de contenido

| Script | Qué hace |
|--------|----------|
| `npm run setup:schema` | Crea/actualiza colecciones, campos y relaciones por API. **Idempotente y no destructivo.** |
| `npm run setup:access` | Crea roles, policies, permisos y las cuentas `editor@` y `portal@`. |
| `npm run migrate` | Carga el contenido de `src/data/*.json` en Directus (solo si está vacío). |
| `npm run migrate:force` | Borra todo el contenido y lo vuelve a cargar. |
| `npm run verify` | 85 comprobaciones: conteos, relaciones, published, permisos y assets. |

> ⚠️ **No uses `npx directus snapshot apply`.** En Directus 12.1.1 borró 5 colecciones
> con sus tablas. `directus/snapshot.yaml` es solo documentación del esquema objetivo;
> para evolucionar el esquema usa `npm run setup:schema`.


### Generar secrets seguros
```bash
# Para DIRECTUS_KEY, DIRECTUS_SECRET, POSTGRES_PASSWORD, JWT_SECRET
openssl rand -hex 32

# Para DIRECTUS_ADMIN_PASSWORD
openssl rand -hex 16
```

---

## 🔧 Operación Diaria

### Comandos básicos
```bash
# Estado de servicios
docker compose ps

# Logs en tiempo real
docker compose logs -f directus
docker compose logs -f caddy
docker compose logs -f postgres

# Reiniciar un servicio
docker compose restart directus

# Parar todo (datos persisten en volúmenes)
docker compose down

# Ver uso de recursos
docker stats
```

### Acceso a Directus Admin
- URL: `https://portal.rr.local/admin`
- Usuario: `DIRECTUS_ADMIN_EMAIL`
- Password: `DIRECTUS_ADMIN_PASSWORD`

### Primer despliegue (después de `docker compose up -d`)
Si Directus falla con "Upload directory not writable":
```bash
docker volume create comandosrr_directus_data
docker run --rm -v comandosrr_directus_data:/d alpine chown -R 1000:1000 /d
docker compose up -d
```

---

## 💾 Backup y Restore

### Backup automático
```bash
# Ejecutar backup (genera dump SQL + tar de uploads)
./infra/backup.sh

# Salida en: backups/db-<fecha>.sql  +  backups/uploads-<fecha>.tar.gz
```

**⚠️ CRÍTICO:** Copiar backups a **otro disco/NAS** (no solo en el mismo servidor).

```bash
# Ejemplo: copiar a NAS montado en /mnt/nas/backups
cp backups/db-*.sql backups/uploads-*.tar.gz /mnt/nas/backups/comandosrr/
```

### Restore (drill de prueba mensual recomendado)
```bash
# Restaurar BD (sobrescribe datos actuales)
./infra/restore.sh backups/db-20260928-120000.sql

# Restaurar uploads (videos, imágenes)
docker run --rm -v comandosrr_directus_data:/datadir -v $(pwd)/backups:/backup alpine \
  tar xzf /backup/uploads-20260928-120000.tar.gz -C /datadir
```

### Programar backup diario (cron)
```bash
# Editar crontab root
crontab -e

# Backup diario a las 02:00
0 2 * * * cd /opt/ComandosRR && ./infra/backup.sh >> /var/log/comandosrr-backup.log 2>&1
```

---

## 🔄 Actualizaciones

### Actualizar Directus
```bash
# 1. Hacer backup ANTES
./infra/backup.sh

# 2. Actualizar imagen en docker-compose.yml
#    image: directus/directus:12.3.4  (fijar versión, no 'latest')

# 3. Recrear contenedor
docker compose pull directus
docker compose up -d directus

# 4. Verificar migraciones automáticas en logs
docker compose logs -f directus
```

### Actualizar Next.js (Frontend)
```bash
# 1. Pull cambios
git pull origin main

# 2. Rebuild
docker compose build next
docker compose up -d next
```

### Actualizar Caddy / PostgreSQL
Mismo patrón: backup → cambiar versión en `docker-compose.yml` → `docker compose up -d <servicio>`

---

## 🛠 Troubleshooting

### Directus no inicia (healthcheck fail)
```bash
# Ver logs
docker compose logs directus

# Común: permisos volumen
docker run --rm -v comandosrr_directus_data:/d alpine chown -R 1000:1000 /d
docker compose restart directus
```

### Error "custom_permission_rules_enabled"
Configurar permisos manualmente en Directus Admin → Settings → Roles

### Caddy: certificado TLS
- Producción: configurar CA empresarial en Caddyfile
- Desarrollo: `tls internal` (auto-firmado, acepta warning en navegador)

### Puerto 80/443 ocupado
```bash
# Ver qué usa el puerto
ss -tlnp | grep :80

# Cambiar puertos en .env y docker-compose.yml
HTTP_PORT=8080
HTTPS_PORT=8443
```

### Base de datos: conexiones agotadas
```bash
# Ver conexiones activas
docker compose exec postgres psql -U directus -d comandosrr -c "SELECT count(*) FROM pg_stat_activity;"

# Aumentar max_connections en postgres.conf si necesario
```

### Frontend: error de build
```bash
# Limpiar cache
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Videos no reproducen (byte-range)
```bash
# Verificar que Directus sirve assets con Range
curl -H "Range: bytes=0-1023" https://portal.rr.local/assets/<file-id>
# Debe responder 206 Partial Content
```

---

## 📁 Estructura del Proyecto

```
ComandosRR/
├── .env                    # Secrets (NO en git)
├── .env.example            # Plantilla
├── .env.local              # Config frontend (NO en git)
├── docker-compose.yml      # Stack principal
├── next.config.ts          # Config Next.js
├── package.json            # Deps frontend
├── tsconfig.json           # TypeScript
├── middleware.ts           # Auth middleware
├── public/
│   ├── manifest.json       # PWA
│   └── og-image.svg        # Social sharing
├── src/
│   ├── app/                # App Router (Next.js 15)
│   │   ├── api/            # API Routes
│   │   │   ├── auth/       # Login/Logout
│   │   │   ├── progreso/   # Completar proceso
│   │   │   └── quiz/       # Quiz endpoints
│   │   ├── login/          # Página login
│   │   ├── mi-progreso/    # Dashboard agente
│   │   ├── quiz/[slug]/    # Evaluaciones
│   │   ├── busqueda/       # Módulo búsqueda
│   │   ├── suscriptor/     # Módulo suscriptor
│   │   ├── consultas/      # Módulo consultas
│   │   ├── procesos/       # Listado + detalle
│   │   ├── tutoriales/     # Videos
│   │   ├── layout.tsx      # Layout raíz + SEO
│   │   └── page.tsx        # Home
│   ├── components/
│   │   ├── layout/         # Navbar, Footer, UserMenu
│   │   ├── modules/        # Hero, ModuleSection, CommandCard, VideoCard
│   │   ├── processes/      # ProcessCard, ProcesoCard, StepList
│   │   └── ui/             # Button, Icons, SectionDivider
│   ├── lib/
│   │   ├── auth.ts         # JWT, cookies, Directus auth
│   │   ├── directus.ts     # Cliente SDK + queries
│   │   └── utils.ts        # Helpers (cn, iconMap, etc.)
│   ├── styles/
│   │   └── globals.css     # Design tokens + base styles
│   └── types/
│       ├── index.ts        # Tipos contenido (Modulo, Comando, etc.)
│       └── auth.ts         # Tipos auth (Progreso, Quiz, Intento)
├── scripts/
│   ├── migrate.mjs         # Migración HTML → Directus
│   ├── verify.mjs          # Verificación 1:1
│   ├── setup-phase3.mjs    # Schema Fase 3
│   └── seed-quiz.mjs       # Poblar preguntas quiz
├── infra/
│   ├── Caddyfile           # Proxy + TLS
│   ├── backup.sh           # Backup BD + uploads
│   ├── restore.sh          # Restore BD
│   └── placeholder/        # Página temporal Fase 0
└── docs/
    └── PHASE3_PERMISOS.md  # Configuración permisos Directus
```

---

## 🔐 Seguridad

- **Cookies:** `httpOnly`, `secure`, `sameSite: lax`
- **JWT:** Firmado con HS256, expiración 8h (access) / 7d (refresh)
- **Middleware:** Protege `/mi-progreso`, `/quiz/*`
- **Directus:** Políticas por rol (`agente` = solo sus datos)
- **Red:** Solo acceso interno, TLS obligatorio
- **Headers:** CSP-ready, X-Frame-Options, X-Content-Type-Options

---

## ♿ Accesibilidad

- **WCAG AA:** Contraste, focus-visible, aria-labels
- **Navegación teclado:** Tab, Enter, Escape en modales/quiz
- **Screen readers:** Semántica HTML5, roles ARIA
- **Responsive:** 3 breakpoints (1200px, 768px, 480px)

---

## 📊 Monitoreo sugerido

- **Uptime:** Healthchecks de Docker (`docker compose ps`)
- **Disco:** `df -h` (alertar > 80%)
- **RAM:** `docker stats` (alertar > 85%)
- **Logs:** Centralizar con Loki/Grafana o similar
- **Backup:** Verificar archivo generado diario + test restore mensual

---

## 📝 Licencia

Uso interno exclusivo para agentes de servicio al cliente.  
© 2026 Jefferson & Leonardo — Todos los derechos reservados.