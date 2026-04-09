# ---- base ----
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# ---- builder ----
FROM base AS builder
WORKDIR /app

# Layer-cache: install deps before copying source
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN pnpm install --frozen-lockfile

# Pass API URL at build time (override with --build-arg in production)
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY client ./client
RUN pnpm --filter client build

# ---- runner ----
# outputFileTracingRoot is pinned to the client dir in next.config.mjs, so
# standalone/server.js is always at the root of .next/standalone.
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Standalone bundle: includes server.js + its own node_modules
COPY --from=builder /app/client/.next/standalone ./
# Static assets and public dir must sit alongside server.js
COPY --from=builder /app/client/.next/static ./.next/static
COPY --from=builder /app/client/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
