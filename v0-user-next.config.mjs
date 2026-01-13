/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Explicitly set output to ensure consistent behavior
  output: 'standalone',
};

export default nextConfig;
