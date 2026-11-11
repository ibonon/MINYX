# syntax=docker/dockerfile:1
# ============================================================
# MINYX — Image de production (Next.js standalone + Prisma/PostgreSQL)
#
# Contexte de build : RACINE du monorepo.
#   docker build -f apps/web/Dockerfile -t minyx-web .
#
# Cibles :
#   runner   → image applicative (défaut)
#   migrator → one-shot `prisma migrate deploy` (service compose `migrate`)
# ============================================================

FROM node:20-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# ── Dépendances + build ─────────────────────────────────────
FROM base AS builder
# Manifests d'abord (cache Docker). Tous les workspaces du lockfile doivent
# être présents, sinon `npm ci` refuse de tourner.
COPY package.json package-lock.json turbo.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/mobile/package.json ./apps/mobile/package.json
COPY packages/api/package.json ./packages/api/package.json
COPY packages/core/package.json ./packages/core/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/blockchain/package.json ./packages/blockchain/package.json
RUN npm ci

COPY . .

# Client Prisma généré pour PostgreSQL (moteur Linux : debian-openssl-3.0.x).
RUN npx prisma generate --schema packages/api/prisma/schema.postgres.prisma

RUN npm run build

# ── Migrations (one-shot, à lancer avant/au déploiement) ────
FROM builder AS migrator
CMD ["npx", "prisma", "migrate", "deploy", "--schema", "packages/api/prisma/schema.postgres.prisma"]

# ── Image applicative ───────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
# openssl : requis par le moteur de requête Prisma.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

# Sortie standalone : serveur + node_modules tracés (layout monorepo).
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Le file tracing de Next n'inclut PAS le client Prisma généré (il vit dans
# le workspace packages/api) : on le copie explicitement là où server.js le
# résout (racine du standalone).
COPY --from=builder --chown=nextjs:nodejs /app/packages/api/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/packages/api/node_modules/@prisma ./node_modules/@prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Healthcheck applicatif (route /api/health)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/web/server.js"]
