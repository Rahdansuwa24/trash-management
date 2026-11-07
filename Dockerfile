# ==============================================================================
# Production Dockerfile: Trash Management Modular REST API
# Base: node:20-alpine (Ultralight, < 150 MB total image size)
# Target: Azure VM (B2als_v2, Memory Limit: 512 MB, Port: 3003)
# ==============================================================================

FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3003

# Install curl / wget for container healthcheck
RUN apk add --no-cache curl

# Copy dependency manifests
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy application source code
COPY app.js ./
COPY database/ ./database/
COPY src/ ./src/
COPY public/ ./public/

# Expose internal API port
EXPOSE 3003

# Automated Docker Healthcheck (monitored by Caddy / Docker Compose)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3003/health || exit 1

# Start server
CMD ["node", "app.js"]
