# ---- base ----
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ---- deps ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN pnpm install --frozen-lockfile --filter client...

# ---- builder ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules
COPY client ./client
# Pass build-time API URL (can be overridden via --build-arg)
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter client build

# ---- runner ----
# Use minimal node image — Next.js standalone bundles its own deps
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Standalone output includes the server + necessary node_modules
COPY --from=builder /app/client/.next/standalone ./
COPY --from=builder /app/client/.next/static ./client/.next/static
COPY --from=builder /app/client/public ./client/public

EXPOSE 3000
ENV PORT=3000
CMD ["node", "client/server.js"]
