# ==========================================
# Multi-stage Production Dockerfile for Backend
# ==========================================

# ------------------------------------------
# Stage 1: Build & Compile TypeScript
# ------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# OpenSSL needed for Prisma binary engines on Alpine
RUN apk add --no-cache openssl libc6-compat

# Install dependencies first (layer caching)
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

RUN npm ci

# Copy source files
COPY src ./src

# Generate Prisma client and compile TypeScript to dist/
RUN npx prisma generate
RUN npm run build

# ------------------------------------------
# Stage 2: Minimal & Secure Production Runner
# ------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install runtime dependencies (OpenSSL for Prisma) & dumb-init for proper PID 1 signal forwarding
RUN apk add --no-cache openssl libc6-compat dumb-init curl

# Setup non-root user early
RUN addgroup -S appgroup -g 1001 && adduser -S appuser -u 1001 -G appgroup

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy generated Prisma client and compiled build artifacts from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Create entrypoint runner script with proper execution permissions
RUN printf '#!/bin/sh\nset -e\necho "Running database schema migrations..."\nnpx prisma db push --skip-generate\necho "Ensuring default admin credentials seeded..."\nnode dist/prisma/seed.js || true\necho "Starting backend production server..."\nexec node dist/src/server.js\n' > /app/entrypoint.sh \
    && chmod +x /app/entrypoint.sh \
    && chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

HEALTHCHECK --interval=20s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["/app/entrypoint.sh"]
