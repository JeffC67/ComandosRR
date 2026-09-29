/* ============================================================
   VideoCard — Portal Capacitación RR / AS400
   Reproductor de video con caption y lazy loading
   ============================================================ */

import { Icon } from '@/components/ui/Icons';
import type { Video } from '@/types';

interface VideoCardProps {
  video: Video;
  posterUrl?: string | null;
  videoUrl: string;
}

export function VideoCard({ video, posterUrl, videoUrl }: VideoCardProps) {
  return (
    <div className="video-card bg-surface border border-border rounded-xl overflow-hidden shadow-lg">
      <div className="video-frame w-full bg-surface-3 flex items-center justify-center relative min-h-[280px]">
        <video
          controls
          preload="none"
          poster={posterUrl || undefined}
          className="w-full max-h-[460px] object-contain"
          aria-label={`Tutorial: ${video.titulo}`}
        >
          <source src={videoUrl} type="video/mp4" />
          Tu navegador no soporta el reproductor de video.
        </video>
      </div>
      <div className="video-caption flex items-center gap-2 px-4 py-3 border-t border-border text-xs text-text-muted bg-surface">
        <span className="video-caption-icon text-primary flex-shrink-0" aria-hidden="true">
          <Icon name="video" size={16} />
        </span>
        <span>{video.titulo}</span>
      </div>
    </div>
  );
}