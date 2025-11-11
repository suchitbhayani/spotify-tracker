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

# Test nginx configuration (clean up PID file after test)
RUN nginx -t || (echo "❌ Nginx configuration test failed" && exit 1) && \
    rm -f /var/run/nginx.pid || true

# Create supervisor config for nginx + node.js
RUN echo '[supervisord]' > /etc/supervisor/conf.d/supervisord.conf && \
    echo 'nodaemon=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'user=root' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'logfile=/var/log/supervisor/supervisord.log' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'pidfile=/var/run/supervisord.pid' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '[program:nginx]' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'command=nginx -g "daemon off;"' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autostart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autorestart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'startretries=5' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'startsecs=1' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stderr_logfile=/var/log/supervisor/nginx.err.log' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stdout_logfile=/var/log/supervisor/nginx.out.log' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'priority=10' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stopsignal=QUIT' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '[program:node]' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'command=node /app/server/index.js' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'directory=/app/server' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autostart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autorestart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stderr_logfile=/var/log/supervisor/node.err.log' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stdout_logfile=/var/log/supervisor/node.out.log' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'priority=20' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'environment=NODE_ENV="production"' >> /etc/supervisor/conf.d/supervisord.conf

# Expose port 80 (Render uses this)
EXPOSE 80

# Health check through nginx
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://127.0.0.1/health || exit 1

# Start supervisor (manages nginx + node.js)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
