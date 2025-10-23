# 🐳 Docker Networking Guide for Spotify Tracker

## 🚨 **The IPv4/IPv6 Problem in Docker**

You're absolutely right! The original IPv4/IPv6 detection is **completely wrong** for Dockerized apps.

### ❌ **What Was Broken**

**Original Code (Wrong for Docker):**
```javascript
// This will NEVER work in Docker production
if (currentHost === '::1' || currentHost === '[::1]') {
  return 'http://[::1]:8080'; // ❌ Container can't reach host IPs
}
```

**Why it fails:**
- Containers run in isolated networks
- Users access via external domain (not localhost)
- IPv4/IPv6 detection becomes irrelevant
- Internal container communication uses hostnames

### ✅ **Fixed Implementation**

## 🏗️ **Docker Networking Architecture**

### **Development (Docker Compose)**
```
User → localhost:5173 → frontend:5173 → backend:8080
```

### **Production (Docker + Nginx)**
```
User → your-domain.com → nginx → {frontend:5173, backend:8080}
```

## 🔧 **Environment Detection Logic**

### **Frontend (`App.tsx`)**
```javascript
const getBackendUrl = () => {
  // Production (Docker or hosted)
  if (import.meta.env.PROD) {
    return window.location.origin; // https://your-app.com
  }
  
  // Docker development
  if (import.meta.env.VITE_DOCKER === 'true') {
    return 'http://backend:8080'; // Docker internal hostname
  }
  
  // Local development (non-Docker) - IPv4/IPv6 detection
  // ... existing logic
};
```

### **Backend (`authRouter.js`)**
```javascript
const getRedirectUri = (req) => {
  // Production (Docker or hosted)
  if (process.env.NODE_ENV === 'production') {
    if (process.env.BACKEND_URL) {
      return `${process.env.BACKEND_URL}/auth/spotify/callback`;
    }
    return `${protocol}://${host}/auth/spotify/callback`;
  }
  
  // Docker development
  if (process.env.DOCKER === 'true') {
    return `http://backend:${PORT}/auth/spotify/callback`;
  }
  
  // Local development (non-Docker) - IPv4/IPv6 detection
  // ... existing logic
};
```

## 🚀 **Deployment Scenarios**

### **1. Local Development (Non-Docker)**
```bash
# Frontend: http://localhost:5173
# Backend: http://localhost:8080
# IPv4/IPv6 detection works
```

### **2. Docker Development**
```bash
docker-compose -f docker-compose.dev.yml up --build

# Frontend: http://localhost:5173
# Backend: http://localhost:8080
# Internal: frontend → backend (container networking)
```

### **3. Docker Production**
```bash
docker-compose -f docker-compose.prod.yml up --build

# External: https://your-domain.com
# Internal: nginx → {frontend, backend} (container networking)
```

## 🔐 **Security in Docker**

### **What's Exposed:**
- **Development**: `localhost:5173`, `localhost:8080`
- **Production**: `your-domain.com` (nginx only)

### **What's Hidden:**
- Backend container (internal only)
- Frontend container (internal only)
- Database (internal only)
- Internal container communication

### **Environment Variables:**
```bash
# Development
VITE_DOCKER=true
DOCKER=true

# Production
NODE_ENV=production
BACKEND_URL=https://your-api.com
FRONTEND_URI=https://your-app.com
```

## 🧪 **Testing Docker Networking**

### **Development Testing:**
```bash
# Start Docker development
docker-compose -f docker-compose.dev.yml up --build

# Test frontend
curl http://localhost:5173

# Test backend (should work)
curl http://localhost:8080/health

# Test internal communication
docker exec spotify-tracker-frontend-dev curl http://backend:8080/health
```

### **Production Testing:**
```bash
# Start production
docker-compose -f docker-compose.prod.yml up --build

# Test external access
curl https://your-domain.com

# Test API (through nginx)
curl https://your-domain.com/api/health

# Test internal (should fail - not exposed)
curl https://your-domain.com:8080/health
```

## 📋 **Docker Deployment Checklist**

- [ ] Environment variables set correctly
- [ ] Container networking configured
- [ ] Nginx reverse proxy setup
- [ ] Internal services not exposed
- [ ] External domain configured
- [ ] Spotify redirect URIs updated
- [ ] SSL certificates configured
- [ ] Secrets management setup

## 🎯 **Key Takeaways**

1. **IPv4/IPv6 detection is irrelevant in Docker production**
2. **Use container hostnames for internal communication**
3. **Use external domains for user access**
4. **Nginx handles external routing to internal services**
5. **Environment variables control behavior**

**Your Docker networking is now bulletproof!** 🐳
