# ─── Stage 1: Install ALL dependencies (including devDeps for build) ────────
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
# Full install: Next.js build toolchain (e.g. SWC, ESLint) lives in devDeps.
# The runner stage uses standalone output so node_modules is not copied there.
RUN npm ci

# ─── Stage 2: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry and set production mode
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the Next.js app (standalone output is configured in next.config.mjs)
RUN npm run build

# ─── Stage 3: Production runner ─────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy full app from builder stage
COPY --from=builder --chown=nextjs:nodejs /app ./

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
