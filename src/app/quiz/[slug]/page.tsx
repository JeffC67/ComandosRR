/* ============================================================
   Quiz Page — Portal Capacitación RR / AS400
   /quiz/[slug] — evaluación de un proceso.
   Cliente: el enunciado se pide a /api/quiz/[slug] y la nota se
   registra en /api/quiz/intentos, ambos con la sesión del agente.
   ============================================================ */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Icon } from '@/components/ui/Icons';
import Link from 'next/link';
import type { QuizPregunta, QuizOpcion } from '@/types/auth';

interface PreguntaConOpciones extends QuizPregunta {
  opciones: QuizOpcion[];
}

interface Resultado {
  puntaje: number;
  total: number;
  correctas: number;
}

export default function QuizPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [proceso, setProceso] = useState<{ id: string; titulo: string } | null>(null);
  const [preguntas, setPreguntas] = useState<PreguntaConOpciones[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, string[]>>({});
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let vivo = true;

    (async () => {
      try {
        const res = await fetch(`/api/quiz/${encodeURIComponent(slug)}`);
        if (!res.ok) throw new Error('Esta evaluación no está disponible todavía.');
        const data = await res.json();
        if (!vivo) return;
        setProceso(data.proceso);
        setPreguntas(data.preguntas ?? []);
      } catch (e) {
        if (vivo) setError(e instanceof Error ? e.message : 'Error al cargar la evaluación');
      } finally {
        if (vivo) setCargando(false);
      }
    })();

    return () => {
      vivo = false;
    };
  }, [slug]);

  const alternar = useCallback((preguntaId: string, opcionId: string, tipo: 'unica' | 'multiple') => {
    setRespuestas((prev) => {
      if (tipo === 'unica') return { ...prev, [preguntaId]: [opcionId] };
      const actuales = prev[preguntaId] ?? [];
      return {
        ...prev,
        [preguntaId]: actuales.includes(opcionId) ? actuales.filter((id) => id !== opcionId) : [...actuales, opcionId],
      };
    });
  }, []);

  async function enviar() {
    if (!proceso || enviando) return;
    setEnviando(true);
    setError('');

    try {
      const res = await fetch('/api/quiz/intentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz: proceso.id, respuestas }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo registrar la evaluación');
      }

      setResultado(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar la evaluación');
    } finally {
      setEnviando(false);
    }
  }

  /* ---------- Estados previos ---------- */

  if (cargando) {
    return (
      <section className="module-section">
        <div className="form-card text-center">
          <Icon name="loader" size={32} className="spin" />
          <p className="form-hint mt-4">Cargando evaluación…</p>
        </div>
      </section>
    );
  }

  if (error && !proceso) {
    return (
      <section className="module-section">
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true">
            📝
          </span>
          <span className="empty-state-title">Evaluación no disponible</span>
          <p className="empty-state-text">{error}</p>
          <a href={`/procesos/${slug}`} className="btn btn-secondary">
            Volver al proceso
          </a>
        </div>
      </section>
    );
  }

  if (!proceso || preguntas.length === 0) {
    return (
      <section className="module-section">
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true">
            📝
          </span>
          <span className="empty-state-title">Sin preguntas</span>
          <p className="empty-state-text">Este proceso todavía no tiene evaluación cargada.</p>
        </div>
      </section>
    );
  }

  const pregunta = preguntas[currentIndex];
  const respondida = (respuestas[pregunta.id]?.length ?? 0) > 0;
  const todasRespondidas = preguntas.every((p) => (respuestas[p.id]?.length ?? 0) > 0);
  const avance = Math.round(((currentIndex + 1) / preguntas.length) * 100);
  const aprobado = (resultado?.puntaje ?? 0) >= 70;

  /* ---------- Resultado ---------- */

  if (resultado) {
    return (
      <section className="module-section">
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true">
            {aprobado ? '🎉' : '📖'}
          </span>
          <span className="empty-state-title">{aprobado ? '¡Aprobado!' : 'Todavía no'}</span>
          <p className="empty-state-text">
            Obtuviste <strong>{resultado.puntaje}%</strong> · {resultado.correctas} de {resultado.total} respuestas
            correctas.
          </p>
          <div className="quiz-acciones">
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              <Icon name="refresh-cw" size={16} />
              Reintentar
            </button>
            <a href={`/procesos/${slug}`} className="btn btn-secondary">
              <Icon name="arrow-left" size={16} />
              Volver al proceso
            </a>
          </div>
        </div>
      </section>
    );
  }

  /* ---------- Preguntas ---------- */

  return (
    <section className="module-section">
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <Link href="/procesos">Procesos</Link>
        <span className="breadcrumb-sep" aria-hidden="true">
          /
        </span>
        <Link href={`/procesos/${slug}`}>{proceso.titulo}</Link>
        <span className="breadcrumb-sep" aria-hidden="true">
          /
        </span>
        <span aria-current="page">Evaluación</span>
      </nav>

      <header className="module-header">
        <div className="module-header-icon" aria-hidden="true">
          <span className="module-header-emoji">📝</span>
        </div>
        <h1>
          {proceso.titulo}
          <span className="module-header-sub">Evaluación de conocimientos · {preguntas.length} preguntas</span>
        </h1>
      </header>

      <div className="quiz-progress">
        <span className="quiz-progress-text">
          Pregunta {currentIndex + 1} de {preguntas.length}
        </span>
        <div
          className="quiz-progress-track"
          role="progressbar"
          aria-valuenow={avance}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="quiz-progress-fill" style={{ width: `${avance}%` }} />
        </div>
      </div>

      <div className="quiz-card">
        <h2 className="quiz-pregunta">{pregunta.enunciado}</h2>

        <div className="quiz-opciones">
          {pregunta.opciones.map((opcion) => {
            const marcada = respuestas[pregunta.id]?.includes(opcion.id);
            return (
              <label key={opcion.id} className={`quiz-opcion${marcada ? ' is-selected' : ''}`}>
                <input
                  type={pregunta.tipo === 'unica' ? 'radio' : 'checkbox'}
                  name={pregunta.id}
                  value={opcion.id}
                  checked={marcada}
                  onChange={() => alternar(pregunta.id, opcion.id, pregunta.tipo)}
                />
                <span>{opcion.texto}</span>
              </label>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      <div className="quiz-nav">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
        >
          <Icon name="arrow-left" size={16} />
          Anterior
        </button>

        {currentIndex < preguntas.length - 1 ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setCurrentIndex((i) => Math.min(preguntas.length - 1, i + 1))}
            disabled={!respondida}
          >
            Siguiente
            <Icon name="arrow-right" size={16} />
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={enviar} disabled={!todasRespondidas || enviando}>
            {enviando ? (
              <>
                <Icon name="loader" size={16} className="spin" />
                Calificando…
              </>
            ) : (
              <>
                <Icon name="check-circle" size={16} />
                Finalizar y calificar
              </>
            )}
          </button>
        )}
      </div>
    </section>
  );
}
