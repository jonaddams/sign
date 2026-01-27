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
    // Optimize package imports to avoid barrel file imports (200-800ms savings)
    optimizePackageImports: ['lucide-react'],
  },
  // Set output for Docker/containerized deployments if needed
  // output: 'standalone',
};

export default nextConfig;
