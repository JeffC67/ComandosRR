/* ============================================================
   Tutoriales Page — Portal Capacitación RR / AS400
   Listado de videos con el encabezado de módulo de la rama main
   ============================================================ */

import { VideoCard } from '@/components/modules/VideoCard';
import { getAllVideos, getAssetUrl } from '@/lib/directus';
import { EmptyState } from '@/components/ui/EmptyState';

export const revalidate = 60;

export default async function TutorialesPage() {
  const videos = await getAllVideos();

  return (
    <section className="module-section">
      <header className="module-header">
        <div className="module-header-icon" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" />
          </svg>
        </div>
        <h1>
          Tutoriales en Video
          <span className="module-header-sub">
            {videos.length} tutorial{videos.length === 1 ? '' : 'es'} disponible
            {videos.length === 1 ? '' : 's'}
          </span>
        </h1>
      </header>

      {videos.length === 0 ? (
        <EmptyState
          icono="🎬"
          titulo="Todavía no hay tutoriales"
          texto="Los videos aparecerán aquí en cuanto se carguen desde Directus."
        />
      ) : (
        <div className="videos-grid">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} videoUrl={getAssetUrl(video.archivo)} />
          ))}
        </div>
      )}
    </section>
  );
}
