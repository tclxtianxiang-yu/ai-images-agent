import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for edge runtime
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Allow larger uploads for images
    },
  },

  // Image optimization configuration
  images: {
    // Disable default Next.js image optimization for Cloudflare Workers
    unoptimized: true,
    // Use custom domains for R2 images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.mikasa-ackerman.vip',
        pathname: '/**',
      },
    ],
  },

  // Environment variables available to the client
  env: {
    NEXT_PUBLIC_APP_NAME: 'AI Images Agent',
  },

  // Headers configuration
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
};

export default nextConfig;
