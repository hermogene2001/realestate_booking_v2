/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  // Allow Next.js image optimisation to work on Render (Node server, not static export)
  images: {
    unoptimized: false,
    remotePatterns: [
      // Allow images served from the backend uploads endpoint
      {
        protocol: 'https',
        hostname: 'realestate-booking-api.onrender.com',
        pathname: '/uploads/**',
      },
      // Allow any subdomain on onrender.com (covers preview deployments)
      {
        protocol: 'https',
        hostname: '*.onrender.com',
        pathname: '/**',
      },
    ],
  },

  // Trailing slash keeps routing consistent between Next.js and the CDN
  trailingSlash: true,

  // Expose the backend URL to the browser at build time
  // (runtime env vars via NEXT_PUBLIC_ also work — this is a fallback)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
  },

  // Silence noisy peer-dep warnings from next-pwa / webpack in production builds
  webpack(config, { isServer }) {
    if (!isServer) {
      // Suppress "Critical dependency" warnings from optional peer deps
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = withPWA(nextConfig);
