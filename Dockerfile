# Simple full stack Dockerfile for Render
FROM node:18-alpine

# Install dependencies
RUN apk add --no-cache curl nginx

# Set working directory
WORKDIR /app

# Copy and install backend dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# Copy backend code
COPY server/ ./server/

# Copy and install frontend dependencies
COPY client/package*.json ./client/
RUN cd client && npm ci

# Copy frontend code and build
COPY client/ ./client/
RUN cd client && npm run build

# Copy nginx config
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

# Create nginx directory for static files
RUN mkdir -p /usr/share/nginx/html

# Copy built frontend to nginx directory
RUN cp -r /app/client/dist/* /usr/share/nginx/html/

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'nginx -g "daemon off;" &' >> /app/start.sh && \
    echo 'cd /app/server && node index.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# Expose ports
EXPOSE 80 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start both services
CMD ["/app/start.sh"]
