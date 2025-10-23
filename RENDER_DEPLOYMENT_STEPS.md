# 🚀 Render Deployment - Complete Step-by-Step Guide

## 📋 **Prerequisites Checklist**
- [ ] GitHub repository with your code
- [ ] Render account (free tier available)
- [ ] MongoDB Atlas account (free tier available)
- [ ] Spotify Developer account

## 🔧 **Step 1: Set Up MongoDB Atlas**

### **1.1 Create MongoDB Atlas Account**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free" 
3. Sign up with email or Google
4. Choose "Shared" cluster (free tier)

### **1.2 Create Database Cluster**
1. **Choose Cloud Provider**: AWS (recommended)
2. **Choose Region**: Select closest to your users
3. **Cluster Name**: `spotify-tracker-cluster`
4. Click "Create Cluster"

### **1.3 Configure Database Access**
1. **Database Access** → **Add New Database User**
2. **Username**: `spotify_user`
3. **Password**: Generate secure password (save it!)
4. **Database User Privileges**: "Read and write to any database"
5. Click "Add User"

### **1.4 Configure Network Access**
1. **Network Access** → **Add IP Address**
2. **Add Current IP Address** (for testing)
3. **Add IP Address**: `0.0.0.0/0` (allow all IPs for Render)
4. Click "Confirm"

### **1.5 Get Connection String**
1. **Database** → **Connect**
2. **Connect your application**
3. **Driver**: Node.js
4. **Version**: 4.1 or later
5. **Copy the connection string** (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

## 🚀 **Step 2: Deploy to Render**

### **2.1 Connect Render to GitHub**
1. Go to [Render](https://render.com)
2. Click "Get Started for Free"
3. **Sign up with GitHub**
4. **Authorize Render** to access your repositories

### **2.2 Create New Web Service**
1. Click **"New +"** → **"Web Service"**
2. **Connect Repository**: Select your `spotify-tracker` repository
3. **Configure Service**:
   - **Name**: `spotify-tracker-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: Leave empty (uses root)
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`

### **2.3 Configure Environment Variables**
In Render dashboard → **Environment** tab:

```bash
# Required Variables
NODE_ENV=production
PORT=8080
CLIENT_ID=bc674b33178a4ae1bf7627b9ae63508b
SESSION_SECRET=138b8b219fcee5da97c2c9a5873e87094e17fc7fbd27f88092e7bdc4a63b8bc07d5be5cd5be70bcd948dd7c049a50b466427b32fee6150d3dd7ddd64ea75e9c
MONGO_URI=mongodb+srv://spotify_user:YOUR_PASSWORD@spotify-tracker-cluster.xxxxx.mongodb.net/spotify_tracker?retryWrites=true&w=majority
FRONTEND_URL=https://your-app.onrender.com
```

### **2.4 Deploy Service**
1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Build your application
   - Deploy to their servers

## 🔧 **Step 3: Configure Render Settings**

### **3.1 Render Configuration**
Your `render.yaml` is already configured, but verify:

```yaml
services:
  - type: web
    name: spotify-tracker-backend
    env: node
    plan: free
    buildCommand: cd server && npm install
    startCommand: cd server && npm start
    healthCheckPath: /health
```

### **3.2 Root Package.json**
Ensure your root `package.json` has:

```json
{
  "name": "spotify-tracker",
  "scripts": {
    "start": "cd server && npm start",
    "build": "cd client && npm run build"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## 🎯 **Step 4: Deploy and Test**

### **4.1 Deploy to Render**
1. **Automatic deployment** happens when you push to GitHub
2. **Manual deployment**: Render dashboard → **Manual Deploy**

### **4.2 Get Your App URL**
1. Render dashboard → **Your Service**
2. Copy the **generated URL** (e.g., `https://spotify-tracker-backend.onrender.com`)
3. Update `FRONTEND_URL` variable with this URL

### **4.3 Test Your Deployment**
```bash
# Test health endpoint
curl https://your-app.onrender.com/health

# Should return:
# {"ok": true, "service": "spotify-recommender-backend", "mongo": "connected"}
```

## 🔐 **Step 5: Security Configuration**

### **5.1 Update Spotify App Settings**
1. **Spotify Developer Dashboard** → **Your App** → **Edit Settings**
2. **Redirect URIs** - Add:
   - `https://your-app.onrender.com/auth/spotify/callback`
   - `http://localhost:8080/auth/spotify/callback` (for local testing)

### **5.2 Environment Variables Security**
- ✅ **CLIENT_ID**: Safe to expose (public)
- ✅ **SESSION_SECRET**: Keep secret (already set)
- ✅ **MONGO_URI**: Keep secret (already set)
- ✅ **FRONTEND_URL**: Safe to expose (public)

## 🧪 **Step 6: Testing Your Live App**

### **6.1 Test Authentication**
1. Visit your Render URL
2. Click "Connect with Spotify"
3. **Should redirect to Spotify login**
4. **After login, should redirect back to your app**

### **6.2 Test API Endpoints**
```bash
# Test health check
curl https://your-app.onrender.com/health

# Test authentication
curl https://your-app.onrender.com/api/me
```

### **6.3 Check Logs**
1. Render dashboard → **Logs** tab
2. Look for any errors or warnings
3. Should see: `✅ Connected to MongoDB`

## 🚨 **Troubleshooting Common Issues**

### **Issue: "Invalid redirect URI"**
- **Fix**: Update Spotify app redirect URIs with your Render URL
- **Check**: Render URL format: `https://your-app.onrender.com/auth/spotify/callback`

### **Issue: "MongoDB connection failed"**
- **Fix**: Check MONGO_URI format
- **Check**: MongoDB Atlas network access (0.0.0.0/0)
- **Check**: Database user permissions

### **Issue: "CORS errors"**
- **Fix**: FRONTEND_URL should match your Render domain
- **Check**: No trailing slashes in URLs

### **Issue: "App not starting"**
- **Fix**: Check Render logs for errors
- **Check**: All environment variables are set
- **Check**: Node.js version compatibility

## 📊 **Step 7: Monitoring Your App**

### **7.1 Render Dashboard**
- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time application logs
- **Deployments**: Deployment history

### **7.2 Health Monitoring**
```bash
# Set up monitoring (optional)
curl https://your-app.onrender.com/health
```

## 🎉 **Step 8: Go Live!**

### **8.1 Final Checklist**
- [ ] MongoDB Atlas cluster running
- [ ] Render deployment successful
- [ ] Environment variables set
- [ ] Spotify OAuth configured
- [ ] Health endpoint responding
- [ ] Authentication flow working

### **8.2 Share Your App**
Your app is now live at: `https://your-app.onrender.com`

## 💰 **Costs**
- **Render**: Free tier (750 hours/month)
- **MongoDB Atlas**: Free tier (512MB storage)
- **Total**: $0/month for small usage

## 🆘 **Need Help?**
- **Render Docs**: https://render.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com
- **Spotify API Docs**: https://developer.spotify.com/documentation

**Your Spotify Tracker is now live on Render! 🎉**
