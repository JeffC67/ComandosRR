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
