/* ============================================================
   Iconos Lucide — Portal Capacitación RR / AS400
   Wrapper tipado para iconos consistentes
   ============================================================ */

import {
  // Navegación / Layout
  Home,
  Search,
  Users,
  HelpCircle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  // Comandos / Acciones
  User,
  Package,
  Car,
  Phone,
  Mail,
  FileText,
  CreditCard,
  Wrench,
  Megaphone,
  Globe,
  PhoneCall,
  ClipboardList,
  Monitor,
  Plus,
  Zap,
  Keyboard,
  Video,
  DollarSign,
  // Procesos
  CheckCircle,
  Circle,
  ArrowRight,
  ArrowLeft,
  // UI
  Loader2,
  ExternalLink,
  Shield,
  Clock,
  Hash,
  Settings,
  LogOut,
  LogIn,
  UserCheck,
  Award,
  Star,
  Eye,
  EyeOff,
  Download,
  Upload,
  Trash2,
  Edit,
  Copy,
  Link,
  Share2,
  Filter,
  RefreshCw,
  AlertCircle,
  Info,
  Check,
  Minus,
  MoreHorizontal,
  MoreVertical,
  ChevronsUpDown,
  ChevronsLeftRight,
  Gamepad,
  Pause,
  Lock,
} from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react';

type LucideIcon = ForwardRefExoticComponent<SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>>;

const iconComponents: Record<string, LucideIcon> = {
  // Navegación
  home: Home,
  search: Search,
  users: Users,
  'help-circle': HelpCircle,
  menu: Menu,
  x: X,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  // Comandos
  user: User,
  package: Package,
  car: Car,
  phone: Phone,
  mail: Mail,
  'file-text': FileText,
  'credit-card': CreditCard,
  wrench: Wrench,
  megaphone: Megaphone,
  globe: Globe,
  'phone-call': PhoneCall,
  'clipboard-list': ClipboardList,
  monitor: Monitor,
  plus: Plus,
  zap: Zap,
  keyboard: Keyboard,
  video: Video,
  'dollar-sign': DollarSign,
  // Procesos / UI
  'check-circle': CheckCircle,
  circle: Circle,
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,
  loader: Loader2,
  'external-link': ExternalLink,
  shield: Shield,
  clock: Clock,
  hash: Hash,
  settings: Settings,
  'log-out': LogOut,
  'log-in': LogIn,
  'user-check': UserCheck,
  award: Award,
  star: Star,
  eye: Eye,
  'eye-off': EyeOff,
  download: Download,
  upload: Upload,
  'trash-2': Trash2,
  edit: Edit,
  copy: Copy,
  link: Link,
  'share-2': Share2,
  filter: Filter,
  'refresh-cw': RefreshCw,
  'alert-circle': AlertCircle,
  info: Info,
  check: Check,
  minus: Minus,
  'more-horizontal': MoreHorizontal,
  'more-vertical': MoreVertical,
  'chevrons-up-down': ChevronsUpDown,
  'chevrons-left-right': ChevronsLeftRight,
  // Procesos / juego de teclas
  refresh: RefreshCw,
  gamepad: Gamepad,
  pause: Pause,
  lock: Lock,
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: keyof typeof iconComponents;
  size?: number;
  className?: string;
}

/* Componente Icon tipado */
export function Icon({ name, size = 20, className = '', ...props }: IconProps) {
  const Component = iconComponents[name];
  if (!Component) {
    console.warn(`[Icon] Icono no encontrado: ${name}`);
    return <HelpCircle {...props} width={size} height={size} className={className} />;
  }
  return <Component {...props} width={size} height={size} className={className} />;
}

/* Iconos semánticos de acceso rápido */
export const Icons = {
  nav: {
    home: 'home',
    busqueda: 'search',
    suscriptor: 'users',
    consultas: 'help-circle',
    procesos: 'clipboard-list',
  },
  comando: {
    search: 'search',
    user: 'user',
    home: 'home',
    car: 'car',
    package: 'package',
    phone: 'phone',
    mail: 'mail',
    file: 'file-text',
    card: 'credit-card',
    wrench: 'wrench',
    megaphone: 'megaphone',
    globe: 'globe',
    call: 'phone-call',
    clipboard: 'clipboard-list',
    monitor: 'monitor',
    plus: 'plus',
    zap: 'zap',
  },
  proceso: {
    pqr: 'clipboard-list',
    ajuste: 'dollar-sign',
    acometida: 'wrench',
  },
  ui: {
    menu: 'menu',
    close: 'x',
    prev: 'chevron-left',
    next: 'chevron-right',
    down: 'chevron-down',
    up: 'chevron-up',
    loader: 'loader',
    check: 'check-circle',
    clock: 'clock',
    video: 'video',
    keyboard: 'keyboard',
  },
} as const;
