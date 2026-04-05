# ---- base ----
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ---- deps ----
FROM base AS deps
# Copy workspace manifests first (layer cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/
# Dummy client manifest so pnpm workspace resolves without errors
COPY client/package.json ./client/
RUN pnpm install --frozen-lockfile --filter server...

# ---- builder ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY server ./server
RUN pnpm --filter server build

# ---- runner ----
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

ENV NODE_ENV=production

# Copy only what's needed to install production deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN pnpm install --frozen-lockfile --prod --filter server...

# Copy compiled output
COPY --from=builder /app/server/dist ./server/dist

EXPOSE 3001
CMD ["node", "server/dist/src/index.js"]
