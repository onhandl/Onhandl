# ── base ─────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# ── deps — install all workspace dependencies ─────────────────────────────────
# Build context: monorepo root (omn-1/)
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN pnpm install --frozen-lockfile

# ── development — hot-reload via tsx watch ────────────────────────────────────
FROM deps AS development
ENV NODE_ENV=development
WORKDIR /app/server
# Copy server source into the working directory for hot reload
COPY server ./
EXPOSE 3001
CMD ["pnpm", "dev"]

# ── builder — compile TypeScript ──────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app
# Copy full server source (tsconfig rootDir = "./", outDir = "./dist")
COPY server ./server
RUN pnpm --filter server build
# pnpm deploy creates a self-contained dir with non-symlinked node_modules
RUN pnpm deploy --filter server --prod --legacy /deploy

# ── production — lean, non-root ───────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# dist/src/index.js — matches tsconfig: rootDir="./", outDir="./dist", entry=src/index.ts
COPY --from=builder --chown=node:node /deploy/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/server/dist     ./dist

USER node

EXPOSE 3001
CMD ["node", "dist/src/index.js"]
