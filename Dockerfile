# FleetGuard Backend Dockerfile
# Multi-stage build for optimized production image

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:18-alpine AS deps

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# ============================================
# Stage 2: Builder
# ============================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies
COPY backend/package*.json ./
RUN npm ci

# Copy source code
COPY backend/ ./

# ============================================
# Stage 3: Production
# ============================================
FROM node:18-alpine AS runner

WORKDIR /app

# Add non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fleetguard

# Set environment to production
ENV NODE_ENV=production

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source from builder stage
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./

# Change ownership to non-root user
RUN chown -R fleetguard:nodejs /app

# Switch to non-root user
USER fleetguard

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Start the application
CMD ["node", "src/server.js"]
