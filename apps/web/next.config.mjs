/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@minyx/ui', '@minyx/core', '@minyx/api', '@minyx/blockchain'],
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  images: {
    domains: ['ipfs.io', 'gateway.pinata.cloud', 'arweave.net'],
  },
};

export default nextConfig;
