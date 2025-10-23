# Multi-stage build for full stack Spotify Tracker
FROM node:18-alpine AS base

# Install dependencies
RUN apk add --no-cache curl

# Backend stage
FROM base AS backend
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ .
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Frontend build stage
FROM base AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

# Frontend serve stage
FROM nginx:alpine AS frontend
COPY --from=frontend-builder /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Final stage - run both services
FROM base AS runner
WORKDIR /app

# Copy backend
COPY --from=backend /app/server ./server
COPY --from=backend /app/server/node_modules ./server/node_modules

# Copy frontend
COPY --from=frontend /usr/share/nginx/html ./public
COPY --from=frontend /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf

# Install nginx
RUN apk add --no-cache nginx

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'nginx -g "daemon off;" &' >> /app/start.sh && \
    echo 'cd /app/server && node index.js' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 80 8080
CMD ["/app/start.sh"]
