/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  images: { unoptimized: true },
  trailingSlash: true,
};

module.exports = withPWA(nextConfig);
