#!/bin/sh
set -e

echo "🚀 Starting application..."

# Ensure nginx directories exist and are writable at runtime
mkdir -p /var/log/nginx /var/cache/nginx /var/run /run /var/log/supervisor

# Create access log file (error log goes to stderr)
touch /var/log/nginx/access.log
chmod 666 /var/log/nginx/access.log

# Make directories writable
chmod -R 777 /var/log/nginx /var/cache/nginx /var/run /run 2>/dev/null || true
chmod 755 /var/log/supervisor 2>/dev/null || true

# Remove any existing PID files that might block startup
rm -f /var/run/nginx.pid /var/run/supervisord.pid 2>/dev/null || true

# Verify frontend files exist
echo "Verifying frontend files..."
if [ ! -f /usr/share/nginx/html/index.html ]; then
    echo "❌ ERROR: index.html not found in /usr/share/nginx/html/"
    ls -la /usr/share/nginx/html/ || echo "Directory doesn't exist"
    exit 1
fi
echo "✅ Frontend files verified:"
ls -la /usr/share/nginx/html/ | head -10

# Get Render's PORT (Render automatically sets this to 10000 for web services)
# This is the port Render routes traffic to - nginx must listen here
RENDER_PORT=${PORT:-10000}
BACKEND_PORT=3000

echo "🔌 Render PORT (nginx will listen here): ${RENDER_PORT}"
echo "🔌 Backend PORT (internal): ${BACKEND_PORT}"

# Update nginx config to listen on Render's PORT
# More specific pattern to avoid replacing ports in comments or other places
sed -i "s/listen 80 default_server/listen ${RENDER_PORT} default_server/g" /etc/nginx/nginx.conf
sed -i "s/listen \[::\]:80 default_server/listen [::]:${RENDER_PORT} default_server/g" /etc/nginx/nginx.conf

# Update nginx config to proxy to backend on internal port (3000 instead of 8080)
sed -i "s|http://127.0.0.1:8080|http://127.0.0.1:${BACKEND_PORT}|g" /etc/nginx/nginx.conf

# Export BACKEND_PORT for supervisor (node process will use PORT=3000 from supervisor config)
export BACKEND_PORT=${BACKEND_PORT}

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t || {
    echo "❌ Nginx configuration test failed!"
    exit 1
}

echo "✅ Nginx configuration test passed"
echo "Starting supervisor..."
echo "Note: Supervisor may show a pkg_resources deprecation warning (red text) - this is harmless"

# Start supervisor (manages nginx + node.js)
# The pkg_resources warning goes to stderr (appears red) but doesn't affect functionality
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf

