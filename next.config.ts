import type { NextConfig } from 'next';

/* `next dev` y `next build`/`next start` comparten `.next` por defecto.
   Si se dejan correr a la vez, el dev reescribe el build de producción
   y entonces el servidor de producción responde 400 a sus propios CSS:
   el HTML que sigue en memoria apunta a un hash de fichero que ya no
   existe, la página se queda sin ninguna hoja de estilos y se ve sin
   maquetar (texto serif, enlaces morados, viñetas del navegador).

   Se separan en dos directorios para que convivan. NEXT_DIST_DIR manda
   si se quiere fijar a mano; si no, se deduce del modo en el que arranca
   Next (next dev → development, next build/start → production). */
const distDir = process.env.NEXT_DIST_DIR || (process.env.NODE_ENV === 'development' ? '.next-dev' : '.next');

const nextConfig: NextConfig = {
  // Artefactos de compilación (ver arriba)
  distDir,

  // Optimización de imágenes
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '127.0.0.1' },
      { protocol: 'http', hostname: 'localhost' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compresión
  compress: true,

  // Rewrites: los videos viven en public/media y los sirve el CDN
  // con Range nativo. No hay proxy de assets.
  async rewrites() {
    return [];
  },

  // Headers de seguridad y caché
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Webpack optimizaciones
  webpack: (config, { dev, isServer }) => {
    // Optimizaciones de producción
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }
    return config;
  },

  // Configuración experimental para mejor rendimiento
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // PoweredBy header
  poweredByHeader: false,

  // React strict mode
  reactStrictMode: true,
};

export default nextConfig;
