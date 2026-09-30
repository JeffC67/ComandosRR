/* ============================================================
   VideoCard — Portal Capacitación RR / AS400
   Estructura idéntica a la rama main.
   ============================================================ */

import type { Video } from '@/types';

interface VideoCardProps {
  video: Video;
  videoUrl: string;
}

export function VideoCard({ video, videoUrl }: VideoCardProps) {
  return (
    <div className="video-section">
      <div className="video-card">
        <div className="video-frame">
          <video
            controls
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={`Tutorial: ${video.titulo}`}
          >
            <source src={videoUrl} type="video/mp4" />
            Tu navegador no soporta el reproductor de video.
          </video>
        </div>
        <div className="video-caption">
          <span className="video-caption-icon" aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
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
          </span>
          {video.titulo}
        </div>
      </div>
    </div>
  );
}
