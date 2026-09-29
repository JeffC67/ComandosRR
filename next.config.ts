import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '127.0.0.1' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/assets/:path*',
        destination: `${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/:path*`,
      },
    ];
  },
};

export default nextConfig;