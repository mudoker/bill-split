/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['pg', '@neondatabase/serverless', 'node:sqlite'],
};

export default nextConfig;
