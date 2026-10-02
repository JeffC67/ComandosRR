# Roles y validación de procesos guiados

Solo 3 roles de usuario. No hay rol visitante.

| Rol | Directus | Puede |
|-----|----------|-------|
| `agente` | `agente` | Ver contenido publicado, proponer procesos (borrador), editar/eliminar **sus** borradores y quiz propio |
| `editor` | `Editor` | Todo lo del agente + CRUD total de procesos/pasos, corregir, **validar y publicar**, eliminar |
| `admin` | `Administrator` | Todo (incluye panel y gestión de usuarios) |

`Portal` es cuenta de servicio interna (Next.js ↔ Directus), no inicia sesión en el portal. La policy pública está **vacía**: sin login no hay contenido ni videos.

## Ciclo de vida

```
agente propone → borrador (NO se publica)
    → editor corrige (PATCH) → valida (POST validar → publicado)
    → o editor elimina (DELETE)
```

Antes de validar no se publica: el portal solo lee `estado=publicado`.

## Dónde

- Proponer/crear: `/procesos/nuevo` (agente propone, editor/admin crean)
- Corregir: `/procesos/[slug]/editar` (agente solo sus borradores)
- Cola de validación: `/editor/revision` (solo editor/admin)
- APIs: `POST /api/procesos`, `PATCH/DELETE /api/procesos/:id`,
  `POST /api/procesos/:id/validar`, `POST /api/pasos`, `PATCH/DELETE /api/pasos/:id`
- Videos públicos: `/media/:archivo` (CDN con Range 206)

## Scripts

```bash
npm run setup:workflow    # campo creado_por + permisos Portal + vaciar pública
npm run verify:workflow   # 26 checks por rol (requiere Next en :3000)
npm run verify            # 85 checks de contenido (Fase 1)
```
