# =============================================================================
# Frontend - Multi-stage Dockerfile
# =============================================================================
# Stage 1: Build with Node
# Stage 2: Serve with Nginx
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Builder
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /build

# Copy package files and install dependencies (cached layer)
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Copy configuration files first
COPY tsconfig*.json ./
COPY vite.config.ts postcss.config.js tailwind.config.js index.html ./

# Copy source code
COPY src ./src
COPY public ./public

# Build arguments for environment variables
# VITE_API_BASE_URL should be empty - service endpoints already include /api prefix
ARG VITE_API_BASE_URL=
ARG VITE_NOTIFICATION_SERVICE_URL=
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID

# Set environment variables for Vite build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_NOTIFICATION_SERVICE_URL=$VITE_NOTIFICATION_SERVICE_URL
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID

# Build the application
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: Runtime (Nginx)
# ---------------------------------------------------------------------------
# Using unprivileged nginx for Kubernetes compatibility
FROM nginxinc/nginx-unprivileged:alpine

# Copy built assets
COPY --from=builder /build/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port (nginx-unprivileged uses 8080)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost:8080/health || exit 1

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
