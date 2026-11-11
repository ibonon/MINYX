import path from 'node:path';

/** @type {import('next').NextConfig} */

// Origines autorisées pour les Server Actions. En production, définir
// APP_ORIGINS="https://app.minyx.ai,https://minyx.ai" (séparées par des virgules).
const allowedOrigins = (process.env.APP_ORIGINS ?? 'localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Racine du monorepo : nécessaire pour que le file tracing inclue les
// dépendances des workspaces (Prisma, chrono-node…) dans l'image Docker.
const monorepoRoot = path.resolve(process.cwd(), '../..');

const nextConfig = {
  // Sortie autonome consommée par apps/web/Dockerfile (image de prod légère).
  output: 'standalone',
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: ['@minyx/ui', '@minyx/core', '@minyx/api'],
  // Modules serveur natifs/CJS : ne pas les bundler côté Next (Prisma, chrono).
  serverExternalPackages: ['@prisma/client', '.prisma/client', 'chrono-node', 'bcryptjs'],
  experimental: {
    serverActions: {
      allowedOrigins,
    },
  },
};

export default nextConfig;
