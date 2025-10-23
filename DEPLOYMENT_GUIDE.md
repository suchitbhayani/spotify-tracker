# 🚀 Spotify Tracker Deployment Guide

## 🔧 **IPv4/IPv6 Compatibility Fixed**

Your auth will **NOT** get fucked when deploying! I've fixed the hardcoded IPv6 issues:

### ✅ **What I Fixed**
- **Backend**: Dynamic redirect URI detection (IPv4/IPv6/Production)
- **Frontend**: Dynamic backend URL detection (IPv4/IPv6/Production)
- **Production**: Uses environment variables for URLs

### 🌐 **How It Works Now**

#### **Local Development**
```javascript
// Automatically detects:
// IPv6: http://[::1]:8080
// IPv4: http://127.0.0.1:8080 or http://localhost:8080
```

#### **Production Deployment**
```javascript
// Uses environment variables:
// BACKEND_URL=https://your-api.com
// FRONTEND_URI=https://your-app.com
```

## 🚀 **Deployment Options**

### **1. Railway (Recommended)**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Environment Variables to Set:**
```
NODE_ENV=production
BACKEND_URL=https://your-app.railway.app
FRONTEND_URI=https://your-app.railway.app
CLIENT_ID=your_spotify_client_id
SESSION_SECRET=your_session_secret
```

### **2. Vercel**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### **3. Heroku**
```bash
# Install Heroku CLI
# Create Procfile (already created)
# Set environment variables in Heroku dashboard
```

### **4. Docker (Local/Server)**
```bash
# Development
docker-compose up --build

# Production
docker-compose -f docker-compose.prod.yml up --build
```

## 🔐 **Spotify App Configuration**

### **Redirect URIs to Add in Spotify Dashboard:**
```
# Development
http://localhost:8080/auth/spotify/callback
http://127.0.0.1:8080/auth/spotify/callback
http://[::1]:8080/auth/spotify/callback

# Production
https://your-domain.com/auth/spotify/callback
```

## 🛡️ **Security Checklist**

### **Before Deploying:**
- [ ] Set strong `SESSION_SECRET`
- [ ] Use HTTPS in production
- [ ] Set proper CORS origins
- [ ] Use environment variables (never hardcode secrets)
- [ ] Test auth flow on both IPv4 and IPv6

### **Environment Variables:**
```bash
# Required
CLIENT_ID=your_spotify_client_id
SESSION_SECRET=your_strong_secret_here

# Production
NODE_ENV=production
BACKEND_URL=https://your-api.com
FRONTEND_URI=https://your-app.com
```

## 🧪 **Testing Auth Flow**

### **Local Testing:**
```bash
# Test IPv4
curl http://localhost:8080/auth/spotify

# Test IPv6  
curl http://[::1]:8080/auth/spotify

# Test both work with same Spotify app
```

### **Production Testing:**
```bash
# Test your deployed URL
curl https://your-domain.com/auth/spotify
```

## 🚨 **Common Issues & Solutions**

### **"Invalid redirect URI"**
- Add all redirect URIs to Spotify Dashboard
- Check environment variables are set correctly

### **"Invalid state"**
- Session configuration issue
- Check `SESSION_SECRET` is set
- Ensure cookies are working

### **CORS errors**
- Check `FRONTEND_URI` environment variable
- Verify CORS configuration in server

## 📋 **Deployment Checklist**

- [ ] All redirect URIs added to Spotify Dashboard
- [ ] Environment variables set in deployment platform
- [ ] HTTPS enabled (production)
- [ ] Test auth flow works
- [ ] Test both IPv4 and IPv6 users can authenticate
- [ ] Monitor logs for any errors

## 🎯 **Quick Start Commands**

```bash
# Local development
npm run dev

# Docker development
docker-compose up --build

# Production deployment
railway up
# or
vercel --prod
# or
docker-compose -f docker-compose.prod.yml up --build
```

Your auth is now **bulletproof** for both IPv4 and IPv6 users! 🎉
