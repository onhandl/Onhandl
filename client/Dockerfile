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

# ── builder — build + deploy ──────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY client ./client
RUN pnpm --filter client build
# pnpm deploy gives a flat, non-symlinked node_modules — avoids pnpm symlink
# tracing issues that break Next.js standalone mode in monorepos.
RUN pnpm deploy --filter client --prod --legacy /client-deploy

# ── production ────────────────────────────────────────────────────────────────
# Uses pnpm deploy (flat node_modules) + next start.
# --chown on every COPY avoids a separate chown -R pass over pnpm's huge store
# (that was the 12-minute step).
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /client-deploy/node_modules ./node_modules
COPY --from=builder --chown=node:node /client-deploy/package.json  ./package.json
COPY --from=builder --chown=node:node /app/client/.next            ./.next
COPY --from=builder --chown=node:node /app/client/public           ./public

USER node
EXPOSE 3000
CMD ["./node_modules/.bin/next", "start"]
