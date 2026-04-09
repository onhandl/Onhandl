# ---- base ----
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# ---- builder ----
FROM base AS builder
WORKDIR /app

# Layer-cache: install deps before copying source
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN pnpm install --frozen-lockfile

# Compile TypeScript
COPY server ./server
RUN pnpm --filter server build

# pnpm deploy creates a self-contained directory with real (non-symlinked)
# node_modules — safe to COPY into the next stage without broken links.
RUN pnpm deploy --filter server --prod /deploy

# ---- runner ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# /deploy contains package.json + flat node_modules (no pnpm virtual store)
COPY --from=builder /deploy/node_modules ./node_modules
# dist/ is built output — pnpm deploy copies the package dir so grab it from builder
COPY --from=builder /app/server/dist ./dist

EXPOSE 3001
CMD ["node", "dist/src/index.js"]
