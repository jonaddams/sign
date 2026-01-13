/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true, // TODO: Fix TypeScript errors in error/page.tsx and other files
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Set output for Docker/containerized deployments if needed
  // output: 'standalone',
};

export default nextConfig;
