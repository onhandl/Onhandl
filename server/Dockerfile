# ── base ─────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# ── deps — install all workspace dependencies ─────────────────────────────────
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
EXPOSE 3001
CMD ["pnpm", "dev"]

# ── builder — compile TypeScript ──────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app
COPY server ./server
RUN pnpm --filter server build
# pnpm deploy creates a self-contained dir with non-symlinked node_modules
RUN pnpm deploy --filter server --prod --legacy /deploy

# ── production — lean, non-root ───────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder --chown=node:node /deploy/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/server/dist      ./dist

USER node

EXPOSE 3001
CMD ["node", "dist/src/index.js"]
