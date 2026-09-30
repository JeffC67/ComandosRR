/* ============================================================
   ModuleSection — Portal Capacitación RR / AS400
   Estructura idéntica a la rama main:
     section.module-section > .module-header + .module-row
       > .video-section + .cards-section > .cards-title + .cards-grid
   El `layout` del módulo (viene de Directus) decide si el video va
   a la izquierda, a la derecha, o si la sección es solo de tarjetas.
   ============================================================ */

import { Icon } from '@/components/ui/Icons';
import { CommandCard } from './CommandCard';
import { VideoCard } from './VideoCard';
import { getAssetUrl } from '@/lib/directus';
import type { Modulo, Comando, Video } from '@/types';

interface ModuleSectionProps {
  modulo: Modulo;
  comandos: Comando[];
  videos: Video[];
}

/* Respaldo si un módulo llega sin `icono` en Directus */
const ICONO_POR_DEFECTO: Record<string, string> = {
  busqueda: 'search',
  suscriptor: 'users',
  consultas: 'link',
  procesos: 'clipboard-list',
};

export function ModuleSection({ modulo, comandos, videos }: ModuleSectionProps) {
  const video = videos[0];
  const videoUrl = video ? getAssetUrl(video.archivo) : null;
  const icon = modulo.icono || ICONO_POR_DEFECTO[modulo.slug] || 'clipboard-list';

  /* main usa el mismo grid .module-row pero invierte el orden en el DOM:
     el módulo de búsqueda pone el video primero y el de suscriptor las
     tarjetas. El de consultas no lleva video: rejilla a ancho completo. */
  const tarjetas = (
    <div className="cards-section">
      {modulo.titulo_tarjetas && <h3 className="cards-title">{modulo.titulo_tarjetas}</h3>}
      <div className="cards-grid" role="list">
        {comandos.map((comando) => (
          <CommandCard key={comando.id} comando={comando} />
        ))}
      </div>
    </div>
  );

  const videoEl = video && videoUrl ? <VideoCard video={video} videoUrl={videoUrl} /> : null;

  return (
    <section id={modulo.slug} className="module-section" aria-labelledby={`${modulo.slug}-title`}>
      <div className="module-header">
        <div className="module-header-icon" aria-hidden="true">
          <Icon name={icon} size={22} />
        </div>
        <h2 id={`${modulo.slug}-title`}>
          {modulo.titulo}
          {modulo.descripcion && <span className="module-header-sub">{modulo.descripcion}</span>}
        </h2>
      </div>

      {!videoEl ? (
        <div className="cards-grid-fullwidth" role="list">
          {comandos.map((comando) => (
            <CommandCard key={comando.id} comando={comando} />
          ))}
        </div>
      ) : modulo.layout === 'video-derecha' ? (
        <div className="module-row">
          {tarjetas}
          {videoEl}
        </div>
      ) : (
        <div className="module-row">
          {videoEl}
          {tarjetas}
        </div>
      )}
    </section>
  );
}
