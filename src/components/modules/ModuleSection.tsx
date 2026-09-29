/* ============================================================
   ModuleSection — Portal Capacitación RR / AS400
   Contenedor de módulo con header, video y tarjetas de comandos
   ============================================================ */

import { Icon } from '@/components/ui/Icons';
import { CommandCard } from './CommandCard';
import { VideoCard } from './VideoCard';
import { getLucideIcon } from '@/lib/utils';
import type { Modulo, Comando, Video } from '@/types';
import { getAssetUrl } from '@/lib/directus';

interface ModuleSectionProps {
  modulo: Modulo;
  comandos: Comando[];
  videos: Video[];
  fullWidth?: boolean;
}

export function ModuleSection({ modulo, comandos, videos, fullWidth = false }: ModuleSectionProps) {
  const iconName = getLucideIcon(modulo.icono);
  const video = videos[0];
  const videoUrl = video ? getAssetUrl(video.archivo) : null;
  const posterUrl = video?.poster ? getAssetUrl(video.poster) : null;

  return (
    <section
      id={modulo.slug}
      className="module-section w-full"
      style={{ scrollMarginTop: '90px' }}
      aria-labelledby={`${modulo.slug}-title`}
    >
      {/* Module Header */}
      <div className="module-header flex items-center gap-4 mb-6 pb-4 border-b-2 border-border relative" style={{
        marginBottom: 'var(--space-6)',
        paddingBottom: 'var(--space-4)',
        borderBottom: '2px solid var(--color-border)',
      }}>
        <div
          className="module-header-icon flex items-center justify-center flex-shrink-0 rounded-lg border"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(14, 165, 233, 0.05))',
            border: '1px solid rgba(14, 165, 233, 0.3)',
            color: 'var(--color-primary)',
            fontSize: '1.3rem',
          }}
          aria-hidden="true"
        >
          <Icon name={iconName} size={22} />
        </div>
        <h2
          id={`${modulo.slug}-title`}
          className="text-text font-bold tracking-tight"
          style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          {modulo.titulo}
          {modulo.descripcion && (
            <span className="module-header-sub block text-text-dim font-normal mt-1" style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 400,
              marginTop: '2px',
            }}>
              {modulo.descripcion}
            </span>
          )}
        </h2>
        <div className="absolute bottom-[-2px] left-0 h-[2px] w-20 rounded-full bg-primary" aria-hidden="true" />
      </div>

      {/* Module Layout: Video + Cards */}
      <div
        className={fullWidth ? 'grid gap-6' : 'grid gap-10'}
        style={{
          display: 'grid',
          gridTemplateColumns: fullWidth ? '1fr' : 'minmax(280px, 5fr) 7fr',
          gap: fullWidth ? 'var(--space-6)' : 'var(--space-10)',
          alignItems: 'start',
        }}
      >
        {/* Video Section */}
        {video && videoUrl && (
          <div className="video-section w-full">
            <VideoCard video={video} posterUrl={posterUrl} videoUrl={videoUrl} />
          </div>
        )}

        {/* Cards Section */}
        <div className="cards-section w-full">
          {comandos.length > 0 && (
            <h3 className="cards-title flex items-center gap-2 mb-4 font-semibold text-secondary" style={{
              fontSize: 'var(--font-size-md)',
              fontWeight: 600,
              color: 'var(--color-secondary)',
              marginBottom: 'var(--space-4)',
            }}>
              <Icon name="zap" size={18} className="text-secondary" />
              Atajos de búsqueda rápidos
            </h3>
          )}
          <div
            className={cn(
              'cards-grid flex flex-col gap-3',
              fullWidth && 'cards-grid-fullwidth'
            )}
            style={{ gap: 'var(--space-3)' }}
            role="list"
            aria-label={`${modulo.titulo} - comandos`}
          >
            {comandos.map((comando) => (
              <CommandCard
                key={comando.id}
                comando={comando}
                compact={fullWidth}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import { cn } from '@/lib/utils';