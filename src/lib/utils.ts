/* ============================================================
   Utilidades — Portal Capacitación RR / AS400
   ============================================================ */

import type { Comando, Proceso } from '@/types';

/* Mapeo de iconos Lucide por nombre del HTML original */
export const iconMap: Record<string, string> = {
  // Comandos de búsqueda
  '🔎': 'search',
  '👤': 'user',
  '🏠': 'home',
  '🚗': 'car',
  '📦': 'package',
  '📞': 'phone',
  '⚡': 'zap',
  // Suscriptor
  '📝': 'file-text',
  '✉️': 'mail',
  '💳': 'credit-card',
  '🛠️': 'wrench',
  '📢': 'megaphone',
  // Consultas
  '🌐': 'globe',
  '☎️': 'phone-call',
  '📋': 'clipboard-list',
  '💻': 'monitor',
  '➕': 'plus',
  // Procesos
  '💰': 'dollar-sign',
  '🔧': 'wrench',
  '🔌': 'zap',
  '🔄': 'refresh',
  '✅': 'check',
  '📺': 'monitor',
  '🕹️': 'gamepad',
  // Marcaciones cerradas
  '🆔': 'hash',
  '🧾': 'file-text',
  '⏸️': 'pause',
  '🔒': 'lock',
  // Videos
  '🎬': 'video',
  // Hero stats
  '⌨️': 'keyboard',
  // Módulos (slugs de Directus)
  busqueda: 'search',
  suscriptor: 'users',
  consultas: 'help-circle',
  procesos: 'clipboard-list',
};

/* Obtener nombre de icono Lucide desde emoji o nombre personalizado */
export function getLucideIcon(name: string | null): string {
  if (!name) return 'help-circle';
  return iconMap[name] || name.toLowerCase().replace(/[^a-z]/g, '-');
}

/* Formatear tecla para mostrar */
export function formatKey(tecla: string): string {
  return tecla
    .replace(/\+/g, ' + ')
    .replace(/F(\d+)/g, 'F$1')
    .trim();
}

/* Determinar si un comando es avanzado */
export function isAdvanced(comando: Comando): boolean {
  return comando.tipo === 'avanzado';
}

/* Obtener color de acento por tipo de proceso */
export function getProcessAccent(proceso: Proceso): 'primary' | 'accent' | 'success' {
  const icon = proceso.icono?.toLowerCase() || '';
  if (icon.includes('dollar') || icon.includes('money') || icon.includes('💰')) return 'accent';
  if (icon.includes('wrench') || icon.includes('tool') || icon.includes('🔧')) return 'success';
  return 'primary';
}

/* Generar slug seguro */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* Truncar texto */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}

/* Classnames helper */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}