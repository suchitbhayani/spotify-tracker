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

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t || {
    echo "❌ Nginx configuration test failed!"
    exit 1
}

echo "✅ Nginx configuration test passed"
echo "Starting supervisor..."

# Start supervisor (manages nginx + node.js)
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf

