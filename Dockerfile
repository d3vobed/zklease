# ─── ZKLease — Root Dockerfile ─────────────────────────────────────────────
# Multi-stage build that compiles the API server and serves it.
# The Next.js frontend is deployed separately via Vercel.
# ──────────────────────────────────────────────────────────────────────────

# ── Stage 1: Install dependencies ─────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json turbo.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN npm install --frozen-lockfile

# ── Stage 2: Build API ────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build --filter=zklease-api

# ── Stage 3: Production runner ────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

RUN mkdir -p /app/data && chown -R appuser:nodejs /app/data

USER appuser

EXPOSE 4000

CMD ["node", "dist/index.js"]
