# Plan de Rediseño - Portal Capacitación RR / AS400

## Contexto Actual

El portal es un sitio estático (HTML + CSS vanilla) en un solo archivo `index.html` de 744 líneas, con todo el CSS embebido y JavaScript inline. Funciona como portal de capacitación para agentes de call center que usan el sistema AS400/RR.

**Problemas identificados:**
- Todo el CSS está embebido en `index.html` (~460 líneas de CSS mezcladas con HTML)
- No se usa el archivo externo `Css/Styles.css` (está obsoleto)
- No hay fuentes tipográficas profesionales (usa genéricas: Segoe UI, Tahoma)
- No hay iconos consistentes (usa emojis: 📌, ⚡, 📋, 💰, 🔧)
- Sin sistema de diseño coherente ni variables CSS
- Sin separación de concerns (HTML mezclado con estilos y scripts)
- Sin breadcrumbs, indicadores de progreso, ni elementos de UX profesionales

---

## Fase 1: Estructura del Proyecto y Limpieza

**Objetivo:** Separar el CSS del HTML, eliminar código muerto, establecer una base organizada.

### Tareas:
1. **Extraer CSS a archivo externo** - Mover todo el CSS embebido a `Css/Styles.css`
2. **Vincular el CSS externo** en `index.html` mediante `<link>`
3. **Eliminar el bloque `<style>`** de `index.html`
4. **Separar JavaScript** a archivo externo `Js/main.js`
5. **Crear estructura de carpetas:**
   ```
   ComandosRR/
   ├── index.html
   ├── Css/
   │   └── Styles.css
   ├── Js/
   │   └── main.js
   └── media/
       ├── Bunny.mp4
       └── Pantera.mp4
   ```

### Criterio de validación:
- El sitio se ve idéntico al original después de la extracción
- No hay CSS ni JavaScript inline en el HTML

---

## Fase 2: Sistema de Diseño (Design Tokens)

**Objetivo:** Establecer variables CSS y un sistema de diseño coherente.

### Tareas:
1. **Definir variables CSS en `:root`** para colores, tipografía, espaciado y sombras
2. **Integrar fuente profesional** desde Google Fonts (Inter, Poppins o DM Sans)
3. **Reemplazar colores hardcodeados** por variables definidas
4. **Establecer iconografía consistente** - usar Lucide Icons o Phosphor Icons (vía CDN) en lugar de emojis

### Paleta propuesta:
| Rol | Actual | Propuesto |
|-----|--------|-----------|
| Fondo principal | `#0d1b2a` | `#0f172a` |
| Fondo tarjetas | `#1b263b` | `#1e293b` |
| Fondo hover | `#2b3a4e` | `#334155` |
| Primario | `#00b4d8` | `#0ea5e9` |
| Secundario | `#90e0ef` | `#38bdf8` |
| Alerta | `#ffd166` | `#f59e0b` |
| Texto primario | `#ffffff` | `#f8fafc` |
| Texto secundario | `#e0e1dd` | `#cbd5e1` |

---

## Fase 3: Rediseño del Navbar

**Objetivo:** Barra de navegación moderna con mejor UX.

### Tareas:
1. **Agregar logo/icono** junto al título
2. **Fondo semitransparente** con `backdrop-filter: blur()`
3. **Menú hamburguesa animado** (hamburger → X con CSS)
4. **Indicador de sección activa** al hacer scroll
5. **Mejorar hover effects** de los links

---

## Fase 4: Rediseño de Módulos (Command Cards)

**Objetivo:** Tarjetas de comandos con mejor jerarquía visual.

### Tareas:
1. **Rediseñar tarjetas** con icono diferenciado por tipo (búsqueda, gestión, consulta)
2. **Separar comandos básicos de avanzados** visualmente
3. **Agregar etiquetas de categoría** sutil
4. **Mejorar hover effects** con transición suave
5. **Micro-animación** de elevación al pasar el cursor

---

## Fase 5: Rediseño de Videos y Layout

**Objetivo:** Mejorar presentación de videos y layout general.

### Tareas:
1. **Rediseñar contenedor de video** con borde sutil y etiqueta "Tutorial"
2. **Mejorar layout flex** - proporción 40% video / 60% tarjetas en desktop
3. **Agregar hero/intro section** al inicio con título, subtítulo y métricas destacadas
4. **Mejorar divisores de sección** con gradientes más sutiles
5. **Optimizar espaciado** entre secciones

---

## Fase 6: Rediseño de Procesos Guiados y Modales

**Objetivo:** Mejorar UX de procesos paso a paso.

### Tareas:
1. **Rediseñar tarjetas de procesos** con:
   - Icono único por proceso
   - Número de pasos indicado
   - Indicador de dificultad o tiempo estimado
2. **Mejorar modales** con:
   - Barra de progreso visual
   - Navegación entre pasos (Anterior/Siguiente)
   - Indicadores de pasos (dots)
   - Icono de completado al finalizar cada paso
3. **Mejorar animación** de apertura/cierre de modales

---

## Fase 7: Responsive Design y Accesibilidad

**Objetivo:** Funcionamiento perfecto en todos los dispositivos.

### Tareas:
1. **Ajustar breakpoints** para Desktop (1200px+), Tablet (768px-1199px), Mobile (320px-767px)
2. **Mejorar touch targets** en mobile (mínimo 44x44px)
3. **Agregar `aria-labels`** a elementos interactivos
4. **Mejorar contraste** para accesibilidad (WCAG AA)
5. **Agregar `focus-visible` states** para navegación por teclado
6. **Lazy loading** para videos off-screen
7. **Meta tags** de SEO y redes sociales

---

## Fase 8: Optimización y Pulido Final

**Objetivo:** Refinamiento final y documentación.

### Tareas:
1. **Minificar CSS** (opcional)
2. **Agregar favicon**
3. **Eliminar código obsoleto**
4. **Verificar rendimiento** con Lighthouse (>90 score)
5. **Crear README.md** con instrucciones del proyecto
6. **Commit final**

---

## Resumen de Ejecución

| Fase | Descripción | Dependencia |
|------|-------------|-------------|
| 1 | Estructura y limpieza | Ninguna |
| 2 | Sistema de diseño | Fase 1 |
| 3 | Navbar | Fase 2 |
| 4 | Command Cards | Fase 2 |
| 5 | Videos y Layout | Fase 3, 4 |
| 6 | Procesos y Modales | Fase 2 |
| 7 | Responsive y Accesibilidad | Fase 3-6 |
| 8 | Optimización final | Todas |

**Tiempo estimado:** 2-4 horas totales

> **Estado:** Fases 1-6 del rediseño visual completadas. El rediseño restante (Fase 7 responsive/accesibilidad y Fase 8 pulido) queda integrado como parte de la **Fase 2** del plan de plataforma ↓

---
---

# Plan: Plataforma Capacitación RR / AS400 con Directus

> Cada fase termina con una **Verificación de funcionamiento** y una **Rectificación de código**.
> **Regla de oro: no se avanza a la fase siguiente hasta pasar ambas.**

## Decisiones confirmadas

| Decisión | Respuesta |
|---|---|
| CMS / Base de datos | **Directus** (self-host, Docker) |
| Editores | Varios, cambios frecuentes → ISR + webhook (sin redeploy) |
| Acceso de agentes | **Solo red interna de la empresa** → todo el stack on-premise |
| Servidor | **Servidor de la empresa** (validar con TI) |
| Videos | En el **mismo servidor** (volumen Docker) |
| Login y progreso/quiz | **Sí**, por agente |

## Arquitectura final

```
Red interna de la empresa
  DNS interno: portal.rr.local ──► Caddy (proxy reverso + TLS)
                                       │
              ┌────────────────────────┼──────────────────────┐
              ▼                        ▼                      ▼
        Next.js (frontend)       Directus (admin/API)    Videos mp4
        :3000                    :8055                   (volumen Docker)
              │                        │
              └──────── API REST ──────┘
                              ▼
                     PostgreSQL (volumen Docker)
```

**Stack Docker Compose:** `caddy` · `next` · `directus` · `postgres` · volumen de uploads/videos.

### Rutas de la plataforma

| Ruta | Contenido | Acceso |
|---|---|---|
| `/` | Hero + métricas auto-calculadas | público |
| `/busqueda`, `/suscriptor`, `/consultas` | Módulos con tarjetas de comandos | público |
| `/procesos` | Listado de procesos guiados | público |
| `/procesos/[slug]` | Detalle con pasos (reemplaza modales) | público |
| `/tutoriales` | Videos | público |
| `/login` | Auth de agentes | — |
| `/mi-progreso` | Procesos completados | 🔒 agente |
| `/quiz/[slug]` | Evaluaciones y resultados | 🔒 agente |

### Schema Directus

```
modulos        slug · titulo · orden · icono · estado
comandos       etiqueta · tecla · tipo(básico|avanzado) · icono · modulo (M2O)
procesos       slug · titulo · descripcion · duracion_min · icono · orden · estado
pasos          proceso (M2O) · orden · grupo · contenido (rich text)
videos         titulo · archivo · poster · modulo (M2O)
quiz_preguntas proceso (M2O) · enunciado · tipo            (Fase 3)
quiz_opciones  pregunta (M2O) · texto · es_correcta        (Fase 3)
progreso       usuario · proceso · completado_en           (Fase 3)
intentos       usuario · quiz · puntaje · fecha            (Fase 3)
```

**Políticas:** `público` = lectura de `estado=publicado` · `agente` = CRUD solo sobre **sus** `progreso`/`intentos` · `editor` = CRUD de contenido · `admin` = todo.

---

## Fase 0 — Infraestructura (servidor + Docker)

**Objetivo:** Directus y la base de datos corriendo, accesibles por red interna.

### Tareas
1. Validar con TI/infraestructura: ⏳ **PENDIENTE (usuario)**
   - [ ] SO, versión, acceso SSH y permisos de despliegue
   - [ ] Docker instalado/habilitado (o instalarlo)
   - [ ] Specs: ≥2 GB RAM libres, CPU, disco para videos
   - [ ] Puertos 80/443 disponibles
   - [ ] DNS interno: registrar `portal.rr.local` (o hostname equivalente)
   - [ ] Certificado TLS (CA interna ideal; Caddy `tls internal` como fallback)
   - [ ] Política de backups (a otro disco/NAS, nunca solo al mismo servidor)
   - [ ] Política de actualizaciones de Directus (quién aplica upgrades)
2. [x] Escribir `docker-compose.yml`: `caddy` + `directus` + `postgres` + volumen de uploads
3. [x] Configurar Caddy: proxy a `directus:8055`, TLS interno, placeholder del portal
4. [x] Backup automatizado de Postgres + volumen de uploads (`infra/backup.sh` + `infra/restore.sh`)
5. [x] Variables de entorno en `.env` (**fuera de git**, `.gitignore`)

### Hallazgos técnicos (aplicados — ver `infra/README.md`)
- Joi 18 de Directus **rechaza emails con TLD falso** (`.local`) → el bootstrap del admin falla
- `/server/health` responde **403** en Directus 12 → usar `/server/ping` en el healthcheck
- Un servicio solo en redes `internal: true` **no publica puertos** → `directus` va también en la red `frontend`
- El volumen `directus_data` nace `root` pero Directus corre como `node` (uid 1000) → `chown` inicial obligatorio

### ✅ Verificación de funcionamiento — **[x] PASADA (entorno local)**
- [x] `docker compose config` sin errores
- [x] `docker compose up -d` levanta los 3 servicios **healthy** (caddy, directus, postgres)
- [x] Directus responde `healthy` y el login de admin emite token JWT
- [x] Caddy valida su configuración y sirve `/` (placeholder), `/admin/` y `/server/info` con TLS interno
- [x] `infra/backup.sh` genera dump + tar; el dump **restaura en una BD limpia** (33 tablas, 0 errores con `ON_ERROR_STOP`)
- [x] Expuestos: Caddy (portal) y Directus solo en `127.0.0.1`; PostgreSQL **sin puertos publicados**
- [ ] *(producción)* Nada expuesto a internet — validar en el servidor de la empresa

### 🔍 Rectificación de código — **[x] PASADA**
- [x] `.env` y `backups/` en `.gitignore`; sin secretos en archivos trackeados (`.env.example` solo placeholders)
- [x] `restart: unless-stopped` + healthchecks en los 3 servicios
- [x] `shellcheck` no disponible en este equipo → validado con `bash -n` (sintaxis OK)
- [x] `infra/README.md` con operación (arranque, parada, backup, restore, primer despliegue)

> ⚠ **Incidencia:** algo (posiblemente un `cp .env.example .env` manual) sobrescribió `.env`
> durante la fase, dejando placeholders. Se regeneró el entorno completo desde cero.
> Verificar `md5sum .env` antes de cada fase para detectarlo a tiempo.

---

## Fase 1 — Schema Directus + migración del contenido actual

**Objetivo:** Todo el contenido de `index.html` viva en Directus, editable por los editores.

### Tareas
1. Crear colecciones: `modulos`, `comandos`, `procesos`, `pasos`, `videos` (snapshot `directus/snapshot.yaml`)
2. Configurar campos, relaciones, tipos y `estado` (borrador/publicado)
3. Configurar roles y políticas (público = lectura publicada, editor = CRUD contenido)
4. Script de migración (`scripts/migrate.mjs`): parsear `index.html` →
   - 28+ `comandos` con etiqueta, tecla, tipo e icono
   - 3 `procesos` con sus pasos (contenidos de los modales → colección `pasos`)
   - `modulos` con `slug` (`busqueda`, `suscriptor`, `consultas`, `procesos`)
   - `videos` (`Bunny.mp4`, `Pantera.mp4`) subidos a Directus
5. Verificar que no se pierda ningún dato del HTML original

### ✅ Verificación de funcionamiento
- [ ] API REST devuelve los 28+ comandos y los 3 procesos
- [ ] Cada proceso tiene sus pasos correctos y en orden (comparar con los modales)
- [ ] Editar una etiqueta en el panel/API **se refleja** al reconsultar
- [ ] Contenido `estado=borrador` NO aparece con rol público
- [ ] Rol `editor` puede CRUD contenido pero **no** settings/usuarios
- [ ] Videos se sirven con rango de bytes (barra de progreso funcional)

### 🔍 Rectificación de código
- [ ] Comparación **1:1** HTML actual vs. datos migrados (nada perdido ni duplicado)
- [ ] `slug` únicos, sin duplicados, iconos válidos
- [ ] Políticas revisadas con usuario `editor` de prueba (no escala a admin)
- [ ] Lint del script + commit

---

## Fase 2 — Frontend Next.js por secciones

**Objetivo:** Plataforma navegable con rutas, alimentada por Directus, con el diseño visual del rediseño (fases 1-8 superiores).

### Tareas
1. Scaffolding Next.js (App Router) + `@directus/sdk`
2. Componentes: `CommandCard`, `ProcessCard`, `StepList`, `Navbar`, `Hero`, `VideoCard`
3. Rutas públicas: `/`, `/busqueda`, `/suscriptor`, `/consultas`, `/procesos`, `/procesos/[slug]`, `/tutoriales`
4. Reemplazar modales por páginas de detalle `/procesos/[slug]` con navegación de pasos
5. ISR (`revalidate`) + **webhook** de Directus → revalidación por tag (cambio visible en segundos, sin redeploy)
6. Métricas del hero calculadas desde la API (nada hardcodeado)
7. Sistema de diseño: tokens CSS, Inter, iconos Lucide (sin emojis)
8. Responsive (1200/768/320) y accesibilidad (aria, focus-visible, contraste AA) — *originales fases 7-8*

### ✅ Verificación de funcionamiento
- [ ] Cada ruta carga y muestra su contenido desde Directus
- [ ] Modificar un comando en Directus aparece en la web en <30 s (webhook probado)
- [ ] `/procesos/[slug]` muestra todos los pasos con navegación Anterior/Siguiente
- [ ] Desktop, tablet y móvil sin rotura visual
- [ ] Navegación por teclado completa
- [ ] Videos con lazy-loading, no bloquean LCP

### 🔍 Rectificación de código
- [ ] `npm run build` sin errores ni warnings
- [ ] ESLint + Prettier limpios
- [ ] Sin duplicación: los 3 modales ahora son **una** plantilla
- [ ] Sin credenciales de Directus en el bundle del cliente
- [ ] Lighthouse ≥90 en las 4 categorías de `/`
- [ ] Commits por tarea

---

## Fase 3 — Auth, progreso de agentes y quiz

**Objetivo:** Cada agente con cuenta, guarda su progreso y responde evaluaciones.

### Tareas
1. Login con Directus Auth (JWT en cookie `httpOnly`, `secure`)
2. Middleware de Next.js: proteger `/mi-progreso` y `/quiz/*`
3. Registro/asignación de agentes (rol `agente` en Directus)
4. `/mi-progreso`: procesos completados del agente autenticado
5. Marcar "proceso completado" → colección `progreso`
6. Quiz: `quiz_preguntas` + `quiz_opciones`, `/quiz/[slug]`, puntaje persistido en `intentos`
7. Políticas del rol `agente`: solo ve/crea **sus** registros (prueba explícita)

### ✅ Verificación de funcionamiento
- [ ] Login/logout funcionan; sesión persiste al recargar
- [ ] Sin sesión → `/mi-progreso` redirige a `/login`
- [ ] Dos agentes NO ven el progreso ni intentos del otro (prueba cruzada)
- [ ] Completar un proceso refleja en `/mi-progreso`
- [ ] Quiz guarda puntaje y respeta la regla de intentos definida
- [ ] `agente` no puede editar contenido ni acceder al panel
- [ ] Token expirado redirige limpiamente a login

### 🔍 Rectificación de código
- [ ] Cookie `httpOnly` + `secure`; sin JWT en `localStorage`; sin secretos en cliente
- [ ] Request forzado con rol `agente` contra colecciones ajenas → **403**
- [ ] Toda escritura validada server-side
- [ ] ESLint/build limpios + code review de middleware y sesión
- [ ] Commit

---

## Fase 4 — Pulido, documentación y puesta en producción

**Objetivo:** Portal terminado, operable y mantenible.

### Tareas
1. Optimización: minificado, lazy-loading de video, meta tags SEO/social
2. Favicon propio (SVG inline)
3. Prueba de **restore** real del backup (BD + uploads/videos)
4. `README.md`: arranque, parada, upgrades de Directus, backup/restore, troubleshooting
5. Entrenamiento de editores en el panel de Directus
6. Rollout por etapas con los agentes

### ✅ Verificación de funcionamiento (aceptación final)
- [ ] Recorrido agente: login → módulos → proceso → completar → quiz
- [ ] Recorrido editor: login → editar contenido → visible en la web en segundos
- [ ] Lighthouse ≥90 en `/`, `/procesos`, `/procesos/[slug]`
- [ ] Responsive en los 3 breakpoints
- [ ] Accesibilidad: AA, focus-visible, aria, teclado
- [ ] **Drill de restore** en servidor limpio: contenido + progreso intactos
- [ ] Restart de Docker → todo vuelve solo

### 🔍 Rectificación de código (revisión final)
- [ ] Code review completo del repo
- [ ] Sin código muerto ni CSS/JS inline
- [ ] `.env`/sensibles fuera del repo; audit de `.gitignore`
- [ ] Historial de git limpio con commits convencionales
- [ ] README verificado siguiendo sus pasos literalmente

---

## Resumen de ejecución

| Fase | Descripción | Dependencia | Gate |
|---|---|---|---|
| 0 | Infraestructura + Docker + Directus | Validación con TI | Servicio arriba + backup probado |
| 1 | Schema + migración del contenido | Fase 0 | Contenido 1:1 + API + políticas |
| 2 | Frontend Next.js por secciones | Fase 1 | Rutas + webhook <30 s + Lighthouse |
| 3 | Auth + progreso + quiz | Fase 2 | Aislamiento entre agentes |
| 4 | Pulido + docs + producción | Todas | Recorridos + drill de restore |

**Tiempo estimado:** 5-8 días (pendiente de validación con TI en Fase 0).

**Riesgos abiertos:**
- Capacidad del servidor (videos consumen disco) → definir límite con TI
- Disponibilidad única (sin CDN externo) → el backup es la única red de seguridad
- Reglas del quiz (intentos, puntaje mínimo) → definir antes de la Fase 3
