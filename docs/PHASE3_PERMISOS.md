# Configuración de Permisos — Fase 3

## Pasos manuales en Directus Admin (https://portal.rr.local/admin)

### 1. Configurar rol "Administrator" (acceso total)

1. Ir a **Settings → Roles → Administrator**
2. En la pestaña **Permissions**, buscar las nuevas colecciones:
   - `progreso`
   - `quiz_preguntas`
   - `quiz_opciones`
   - `intentos`
3. Para cada colección, habilitar: **Create, Read, Update, Delete** (acceso completo)
4. Guardar cambios

### 2. Configurar rol "agente" (acceso restringido)

1. Ir a **Settings → Roles → agente**
2. Colección `progreso`:
   - Create: ✅ (con validación `agente = $CURRENT_USER`)
   - Read: ✅ (con filtro `agente = $CURRENT_USER`)
   - Update: ✅ (con filtro `agente = $CURRENT_USER`)
   - Delete: ✅ (con filtro `agente = $CURRENT_USER`)
3. Colección `quiz_preguntas`:
   - Read: ✅ (con filtro `estado = publicado`)
4. Colección `quiz_opciones`:
   - Read: ✅ (con filtro `pregunta.estado = publicado`)
   - Campos permitidos: `id`, `texto`, `orden` (NO `es_correcta`)
5. Colección `intentos`:
   - Create: ✅ (con validación `agente = $CURRENT_USER`)
   - Read: ✅ (con filtro `agente = $CURRENT_USER`)
   - Update: ✅ (con filtro `agente = $CURRENT_USER`)
   - Delete: ✅ (con filtro `agente = $CURRENT_USER`)
6. Colección `procesos`:
   - Read: ✅ (con filtro `estado = publicado`)
7. Colección `pasos`:
   - Read: ✅ (con filtro `proceso.estado = publicado`)
8. Colección `directus_files`:
   - Read: ✅ (sin filtro)
9. Guardar cambios

### 3. Cuenta de servicio para Next.js (SSR/ISR)

**No hay token estático.** Directus 12 los eliminó, así que no existe una
clave fija que pegar en el entorno: el servidor inicia sesión con una
cuenta y el SDK renueva la sesión sola (`ACCESS_TOKEN_TTL=1d` en
`docker-compose.yml`).

1. Ejecutar `npm run setup:access`, que crea la cuenta `portal@...` con
   el rol `Portal` e imprime su contraseña (solo la muestra al crearla).
2. Ponerla en `.env.local`:
   ```
   DIRECTUS_SERVICE_EMAIL=portal@capacitacion-rr.co
   DIRECTUS_SERVICE_PASSWORD=<la que imprimió setup:access>
   ```
3. Esa cuenta **sí** escribe en `progreso` y `quiz_intentos` (datos del
   agente), pero el contenido de las fases 1 y 2 sigue siendo de solo
   lectura. Para resetear la contraseña, vuelve a ejecutar
   `npm run setup:access`.

### 4. Crear usuario agente de prueba

1. Ir a **Settings → Users**
2. Crear nuevo usuario:
   - Email: `agente1@empresa.co`
   - Password: `cambiar123`
   - Rol: `agente`
   - Estado: Activo
3. Repetir para `agente2@empresa.co` (para probar aislamiento)

---

## Verificación rápida via API

```bash
# Verificar acceso admin a quiz_preguntas
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://portal.rr.local/items/quiz_preguntas?fields=id&limit=1"

# Verificar acceso agente (debe fallar sin login)
curl -H "Authorization: Bearer $AGENTE_TOKEN" \
  "https://portal.rr.local/items/quiz_preguntas?fields=id&limit=1"
```

---

## Poblar preguntas de prueba

Una vez configurados los permisos:

```bash
cd scripts
node seed-quiz.mjs
```