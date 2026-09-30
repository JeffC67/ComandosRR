/* ============================================================
   Login Page — Portal Capacitación RR / AS400
   Alineado con el lenguaje visual de la rama main.
   ============================================================ */

'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/ui/Icons';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/mi-progreso';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Credenciales inválidas');
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="module-section">
      <div className="form-card">
        <div className="login-header">
          <div className="hero-icon login-header-icon" aria-hidden="true">
            <Icon name="home" size={32} />
          </div>
          <h1 className="detail-title text-center">Iniciar Sesión</h1>
          <p className="detail-subtitle login-header-sub">
            Accede a tu progreso y evaluaciones
          </p>
        </div>

        <form onSubmit={handleSubmit} className="stack-md">
          {error && <div className="form-error" role="alert">{error}</div>}

          <div className="form-field">
            <label htmlFor="email" className="form-label">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="agente@empresa.co"
            />
          </div>

          <div className="form-field">
            <label htmlFor="password" className="form-label">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? (
              <>
                <Icon name="loader" size={16} className="spin" />
                Iniciando...
              </>
            ) : (
              <>
                <Icon name="log-in" size={16} />
                Iniciar sesión
              </>
            )}
          </button>
        </form>

        <p className="form-hint">
          ¿No tienes cuenta? Contacta a tu administrador.
        </p>
      </div>
    </section>
  );
}

function LoginFallback() {
  return (
    <section className="module-section">
      <div className="form-card text-center">
        <Icon name="loader" size={32} className="spin" />
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
