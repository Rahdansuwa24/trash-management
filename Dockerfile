# ==============================================================================
# Production Dockerfile: Trash Management Modular REST API & React SPA
# Base: node:20-alpine (Ultralight Multi-Stage Build)
# Target: Azure VM (B2als_v2, Port: 3003)
# ==============================================================================

# --- Stage 1: Build Frontend React App ---
FROM node:20-alpine AS frontend-builder
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Production Unified Runner ---
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3003

# Install curl for container healthcheck
RUN apk add --no-cache curl

# Copy backend dependency manifests & install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy application source code
COPY app.js ./
COPY database/ ./database/
COPY src/ ./src/
COPY public/ ./public/

# Copy compiled frontend static build into /app/frontend/dist
COPY --from=frontend-builder /build/frontend/dist ./frontend/dist

# Expose internal API port
EXPOSE 3003

# Automated Docker Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3003/health || exit 1

# Start server
CMD ["node", "app.js"]
