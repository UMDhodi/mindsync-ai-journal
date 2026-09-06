# ==============================================================================
# MindSync AI - Multi-Stage Production Dockerfile for Google Cloud Run
# ==============================================================================

# --- Stage 1: Build Frontend Assets ---
FROM node:22-alpine AS builder

WORKDIR /app

# Install build prerequisites
COPY package*.json ./
RUN npm ci

# Copy full source tree
COPY . .

# Build Vite SPA and bundle server entry point
RUN npm run build

# --- Stage 2: Production Runtime Container ---
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled bundles and static assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/firestore.rules ./firestore.rules
COPY --from=builder /app/firestore.indexes.json ./firestore.indexes.json

# Expose standard Cloud Run HTTP port
EXPOSE 3000

# Run as non-root user for container security
USER node

# Start compiled server
CMD ["node", "dist/server.cjs"]
