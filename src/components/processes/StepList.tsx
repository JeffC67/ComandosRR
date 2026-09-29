/* ============================================================
   StepList — Portal Capacitación RR / AS400
   Lista de pasos con navegación y indicadores de progreso
   ============================================================ */

'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';
import type { Paso } from '@/types';

interface StepListProps {
  pasos: Paso[];
  procesoTitulo: string;
}

export function StepList({ pasos, procesoTitulo }: StepListProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Agrupar pasos por grupo
  const groupedSteps = pasos.reduce((acc, paso) => {
    const grupo = paso.grupo || 'Pasos';
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(paso);
    return acc;
  }, {} as Record<string, Paso[]>);

  const allSteps = pasos;
  const totalSteps = allSteps.length;

  const goToStep = (index: number) => {
    setCurrentStep(Math.max(0, Math.min(index, totalSteps - 1)));
  };

  const nextStep = () => goToStep(currentStep + 1);
  const prevStep = () => goToStep(currentStep - 1);

  // Focus management
  useEffect(() => {
    const stepContent = document.getElementById(`step-${currentStep}`);
    stepContent?.focus();
  }, [currentStep]);

  return (
    <div className="step-list" role="region" aria-label={`Proceso: ${procesoTitulo}`}>
      {/* Progress Bar */}
      <div className="modal-progress mb-6 p-4 bg-surface-3 border-b border-border rounded-t-xl" style={{
        padding: 'var(--space-3) var(--space-8)',
        background: 'var(--color-surface-3)',
        borderBottom: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
      }}>
        <div className="progress-steps flex items-center gap-2" style={{ gap: 'var(--space-2)' }}>
          {allSteps.map((_, index) => (
            <div
              key={index}
              className={cn(
                'progress-step flex items-center gap-2 flex-1 whitespace-nowrap text-xs text-text-dim',
                index < currentStep && 'completed',
                index === currentStep && 'active'
              )}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-dim)',
                flex: 1,
                whiteSpace: 'nowrap',
              }}
            >
              <span
                className={cn(
                  'progress-dot flex items-center justify-center flex-shrink-0 rounded-full border-2 text-[0.6rem] font-bold',
                  'w-4 h-4',
                  index < currentStep && 'bg-success border-success text-white',
                  index === currentStep && 'bg-primary border-primary text-white',
                  index > currentStep && 'bg-surface-2 border-border'
                )}
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.6rem',
                  flexShrink: 0,
                  transition: 'all var(--transition-med)',
                }}
              >
                {index < currentStep ? <Icon name="check" size={10} /> : index + 1}
              </span>
              {index < allSteps.length - 1 && (
                <span
                  className={cn(
                    'progress-line flex-1 h-[2px]',
                    index < currentStep && 'bg-success',
                    index >= currentStep && 'bg-border'
                  )}
                  style={{
                    flex: 1,
                    height: '2px',
                    margin: '0 var(--space-1)',
                    background: 'var(--color-border)',
                    transition: 'background var(--transition-med)',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="modal-body" style={{ padding: 'var(--space-6) var(--space-8)' }}>
        {Object.entries(groupedSteps).map(([grupo, pasosGrupo], groupIndex) => (
          <div key={grupo} className="modal-body-block" style={{ display: groupIndex === 0 || currentStep >= pasosGrupo[0].orden - 1 ? 'block' : 'none' }}>
            {grupo && (
              <span className="sub-section-title block mb-4" style={{
                color: 'var(--color-accent)',
                fontWeight: 600,
                fontSize: 'var(--font-size-sm)',
                margin: 'var(--space-6) 0 var(--space-4)',
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                {grupo}
              </span>
            )}
            <ol className="space-4 list-none counter-reset-step" style={{
              paddingLeft: 'var(--space-5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
              listStyle: 'none',
              counterReset: 'step',
            }}>
              {pasosGrupo.map((paso, idx) => {
                const globalIndex = allSteps.findIndex(p => p.id === paso.id);
                const isVisible = globalIndex === currentStep || (groupIndex === 0 && globalIndex < currentStep);

                return (
                  <li
                    key={paso.id}
                    id={`step-${globalIndex}`}
                    tabIndex={0}
                    className={cn(
                      'relative pl-8 text-text-muted leading-relaxed',
                      !isVisible && 'hidden'
                    )}
                    style={{
                      color: 'var(--color-text-muted)',
                      fontSize: 'var(--font-size-sm)',
                      lineHeight: 1.6,
                      counterIncrement: 'step',
                      position: 'relative',
                      paddingLeft: '2rem',
                    }}
                    aria-current={globalIndex === currentStep ? 'step' : undefined}
                  >
                    <span
                      className="absolute left-0 top-1 flex items-center justify-center rounded-full bg-primary/15 text-primary font-bold"
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--font-size-xs)',
                        background: 'rgba(14, 165, 233, 0.15)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {globalIndex + 1}
                    </span>
                    <div
                      className="prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: paso.contenido }}
                    />
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="modal-nav flex items-center justify-between gap-4 border-t border-border p-4" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--space-4) var(--space-8)',
        borderTop: '1px solid var(--color-border)',
        gap: 'var(--space-4)',
      }}>
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className={cn(
            'modal-nav-btn inline-flex items-center gap-2 bg-transparent border border-border text-text-muted font-medium px-4 py-2 rounded-lg transition-all duration-150',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'hover:not(:disabled):bg-surface-2 hover:not(:disabled):text-text hover:not(:disabled):border-primary'
          )}
          aria-label="Paso anterior"
        >
          <Icon name="arrowLeft" size={16} />
          Anterior
        </button>

        <div className="nav-steps-indicator flex gap-1.5" style={{ gap: '6px' }}>
          {allSteps.map((_, index) => (
            <span
              key={index}
              className={cn(
                'nav-dot rounded-full border transition-all duration-300',
                index === currentStep && 'bg-primary border-primary w-5',
                index !== currentStep && 'bg-surface-2 border-border w-2'
              )}
              style={{
                width: index === currentStep ? '20px' : '8px',
                height: '8px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--color-border)',
                transition: 'all var(--transition-med)',
              }}
            />
          ))}
        </div>

        <button
          onClick={nextStep}
          disabled={currentStep >= totalSteps - 1}
          className={cn(
            'modal-nav-btn inline-flex items-center gap-2 bg-primary border-primary text-white font-medium px-4 py-2 rounded-lg transition-all duration-150',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'hover:not(:disabled):bg-primary-dark hover:not(:disabled):border-primary-dark'
          )}
          aria-label="Siguiente paso"
        >
          {currentStep >= totalSteps - 1 ? 'Finalizar' : 'Siguiente'}
          <Icon name="arrowRight" size={16} />
        </button>
      </div>
    </div>
  );
}