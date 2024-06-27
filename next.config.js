/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputStandalone: true,
  },
  serverRuntimeConfig: {
    PORT: process.env.PORT || 3000,
  },
};

module.exports = nextConfig;
