/* ============================================================
   Tutoriales Page — Portal Capacitación RR / AS400
   Listado de videos
   ============================================================ */

import { VideoCard } from '@/components/modules/VideoCard';
import { getAllVideos } from '@/lib/directus';
import { getAssetUrl } from '@/lib/directus';
import { SectionDivider } from '@/components/ui/SectionDivider';

export const revalidate = 60;
export const dynamic = 'force-dynamic';

export default async function TutorialesPage() {
  const videos = await getAllVideos();

  return (
    <section className="module-section full-width-section" style={{ scrollMarginTop: '90px' }}>
      <div className="module-header flex items-center gap-4 mb-6 pb-4 border-b-2 border-border relative" style={{
        marginBottom: 'var(--space-6)',
        paddingBottom: 'var(--space-4)',
        borderBottom: '2px solid var(--color-border)',
      }}>
        <div className="module-header-icon flex items-center justify-center flex-shrink-0 w-11 h-11 rounded-lg border" style={{
          width: '44px',
          height: '44px',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(14, 165, 233, 0.05))',
          border: '1px solid rgba(14, 165, 233, 0.3)',
          color: 'var(--color-primary)',
          fontSize: '1.3rem',
        }} aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
          </svg>
        </div>
        <h2 className="text-text font-bold tracking-tight" style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }}>
          Tutoriales en Video
        </h2>
        <div className="absolute bottom-[-2px] left-0 h-[2px] w-20 rounded-full bg-primary" aria-hidden="true" />
      </div>

      <div className="grid gap-6 md:grid-cols-2" style={{
        display: 'grid',
        gap: 'var(--space-6)',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      }}>
        {videos.map((video) => {
          const videoUrl = getAssetUrl(video.archivo);
          const posterUrl = video.poster ? getAssetUrl(video.poster) : null;
          return (
            <VideoCard
              key={video.id}
              video={video}
              posterUrl={posterUrl}
              videoUrl={videoUrl}
            />
          );
        })}
      </div>
    </section>
  );
}