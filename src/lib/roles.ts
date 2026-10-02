/* ============================================================
   Roles — Portal Capacitación RR / AS400
   Solo 3 roles de usuario: agente, editor, admin.
   (En Directus se llaman "agente", "Editor" y "Administrator";
   "Portal" es cuenta de servicio interna y la policy pública
   está vacía: no hay rol visitante.)
   ============================================================ */

export type Rol = 'agente' | 'editor' | 'admin';

/* Normaliza "Editor" → editor, "Administrator" → admin */
export function normalizarRol(raw: string | null | undefined): Rol {
  const n = (raw || '').toLowerCase();
  if (n.startsWith('admin')) return 'admin';
  if (n.startsWith('editor')) return 'editor';
  return 'agente';
}

export function esRol(v: unknown): v is Rol {
  return v === 'agente' || v === 'editor' || v === 'admin';
}

export function puedeEditarProcesos(rol: Rol): boolean {
  return rol === 'editor' || rol === 'admin';
}

/* Enlaces de Aplicaciones: mismo criterio que procesos (solo editor/admin
   escriben; el aislamiento vive en el servidor, no en Directus). */
export function puedeEditarEnlaces(rol: Rol): boolean {
  return rol === 'editor' || rol === 'admin';
}

export function puedeValidarProcesos(rol: Rol): boolean {
  return rol === 'editor' || rol === 'admin';
}

export function puedeProponerProcesos(rol: Rol): boolean {
  return rol === 'agente' || rol === 'editor' || rol === 'admin';
}

/* Etiqueta legible para la UI */
export function etiquetaRol(rol: Rol): string {
  return rol === 'admin' ? 'Administrador' : rol === 'editor' ? 'Editor' : 'Agente';
}
