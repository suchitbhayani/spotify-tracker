# Minimal Dockerfile for OAuth + Top Artists deployment
# Removed ML service and dataset dependencies
FROM node:20-alpine

# Install minimal dependencies (nginx for frontend, curl for health checks)
RUN apk add --no-cache curl nginx supervisor

# Set working directory
WORKDIR /app

# Install backend dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# Copy backend code
COPY server/ ./server/

# Install and build frontend
COPY client/package*.json ./client/
RUN cd client && npm ci
COPY client/ ./client/
RUN cd client && npm run build

# Setup nginx directories and permissions
RUN mkdir -p /usr/share/nginx/html \
    /var/log/nginx \
    /var/cache/nginx \
    /var/run \
    /run \
    /etc/supervisor/conf.d \
    /var/log/supervisor && \
    chmod -R 777 /var/log/nginx /var/cache/nginx /var/run /run && \
    chmod 755 /var/log/supervisor

# Copy built frontend to nginx (no need to change ownership, root can read)
RUN cp -r /app/client/dist/* /usr/share/nginx/html/ && \
    ls -la /usr/share/nginx/html/ && \
    echo "✅ Frontend files copied successfully"

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Create startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Test nginx configuration (clean up PID file after test)
RUN nginx -t || (echo "❌ Nginx configuration test failed" && exit 1) && \
    rm -f /var/run/nginx.pid || true

# Copy supervisor config file
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose port 10000 (Render's default for web services)
# Render automatically sets PORT=10000 and routes traffic here
# start.sh will update nginx to listen on ${PORT} at runtime
EXPOSE 10000

# Health check through nginx
# Note: Render's own health check (healthCheckPath: /health) is more reliable
# This healthcheck may fail if nginx hasn't started yet
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://127.0.0.1:${PORT:-10000}/health || exit 1

# Start via startup script (ensures directories exist at runtime)
CMD ["/start.sh"]
