/* ============================================================
   Tipos extendidos — Fase 3: Auth, Progreso, Quiz
   ============================================================ */

export interface Progreso {
  id: string;
  agente: string; // directus_users.id
  proceso: string; // procesos.id
  completado_en: string;
}

export interface QuizPregunta {
  id: string;
  proceso: string;
  enunciado: string;
  tipo: 'unica' | 'multiple';
  orden: number;
  estado: 'borrador' | 'publicado';
}

export interface QuizOpcion {
  id: string;
  pregunta: string;
  texto: string;
  es_correcta: boolean;
  orden: number;
}

export interface Intento {
  id: string;
  agente: string;
  quiz: string; // procesos.id
  puntaje: number;
  respuestas: Record<string, string[]> | null; // preguntaId -> opcionIds[]
  fecha: string;
}

/* Usuario autenticado con datos del perfil */
export interface AuthUser {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role?: string;
  avatar?: string | null;
}

/* Payload del JWT */
export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/* Respuesta de login */
export interface LoginResponse {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  expires: number;
}

/* Stats de progreso para /mi-progreso */
export interface ProgresoStats {
  totalProcesos: number;
  completados: number;
  enProgreso: number;
  promedioQuiz: number;
}