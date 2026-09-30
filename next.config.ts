import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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

  // Rewrites para assets de Directus
  // Ojo: `rewrites()` se evalúa al compilar, así que el destino queda
  // congelado en el routes-manifest. Por eso los <video> y <img> se
  // sirven por el mismo origen (mismo dominio, sin CORS) y no por
  // https://portal.rr.local: así el proxy de Caddy sirve los assets sin
  // depender de un segundo dominio y el video admite Range.
  async rewrites() {
    const base =
      process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://portal.rr.local';
    return [
      {
        source: '/assets/:path*',
        destination: `${base}/assets/:path*`,
      },
    ];
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
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
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