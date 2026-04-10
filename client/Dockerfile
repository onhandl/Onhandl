# ── base ─────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# ── deps — install all workspace dependencies ─────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN pnpm install --frozen-lockfile

# ── development — Next.js dev server with hot-reload ─────────────────────────
FROM deps AS development
ENV NODE_ENV=development
WORKDIR /app/client
EXPOSE 3000
CMD ["pnpm", "dev"]

# ── builder — Next.js standalone build ───────────────────────────────────────
FROM deps AS builder
WORKDIR /app
# API URL is baked in at build time; override via --build-arg for production
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY client ./client
RUN pnpm --filter client build

# ── production — minimal Next.js standalone runner ───────────────────────────
# pnpm uses symlinks that @vercel/nft (Next.js file tracer) can't follow, so
# the standalone bundle is missing `next` and other hoisted packages.
# Fix: copy the full workspace node_modules from builder so every dep resolves.
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/client/.next/standalone ./
COPY --from=builder /app/client/.next/static ./.next/static
COPY --from=builder /app/client/public ./public
# Overwrite the incomplete standalone node_modules with the full resolved set
COPY --from=builder /app/node_modules ./node_modules

RUN chown -R node:node /app
USER node

EXPOSE 3000
CMD ["node", "server.js"]
