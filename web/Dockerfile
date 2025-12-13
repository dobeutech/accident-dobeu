# FleetGuard Web Dashboard Dockerfile
# Multi-stage build for optimized production image

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:18-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# ============================================
# Stage 2: Builder
# ============================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_APP_NAME=FleetGuard

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_APP_NAME=$VITE_APP_NAME

# Build the application
RUN npm run build

# ============================================
# Stage 3: Production with Nginx
# ============================================
FROM nginx:alpine AS runner

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Add non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S fleetguard -u 1001 -G nodejs && \
    chown -R fleetguard:nodejs /usr/share/nginx/html && \
    chown -R fleetguard:nodejs /var/cache/nginx && \
    chown -R fleetguard:nodejs /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R fleetguard:nodejs /var/run/nginx.pid

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:80/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
