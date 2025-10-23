# 🚀 Railway Deployment Guide

## 📋 **Quick Deployment Steps**

### **1. Install Railway CLI**
```bash
npm install -g @railway/cli
```

### **2. Login to Railway**
```bash
railway login
```

### **3. Initialize Project**
```bash
railway init
```

### **4. Set Environment Variables**
```bash
# Set your Spotify credentials
railway variables set CLIENT_ID=your_spotify_client_id
railway variables set SESSION_SECRET=your_session_secret
railway variables set FRONTEND_URL=https://your-app.railway.app

# Set MongoDB (Railway will provide these)
railway variables set MONGO_ROOT_USERNAME=admin
railway variables set MONGO_ROOT_PASSWORD=your_mongodb_password
railway variables set MONGO_HOST=your_mongodb_host
railway variables set MONGO_PORT=27017
railway variables set MONGO_DB=spotify_tracker
```

### **5. Deploy**
```bash
railway up
```

## 🔧 **Railway Configuration**

### **railway.json**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "healthcheckPath": "/health",
    "healthcheckTimeout": 10,
    "restartPolicy": "Always",
    "startupCommand": "npm run start"
  }
}
```

### **package.json (Root)**
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

## 🗄️ **Database Setup**

### **Option 1: Railway MongoDB**
1. Go to Railway Dashboard
2. Click "New Project"
3. Add "MongoDB" service
4. Copy connection string to environment variables

### **Option 2: MongoDB Atlas**
1. Create MongoDB Atlas account
2. Create cluster
3. Get connection string
4. Set `MONGO_URI` environment variable

## 🔐 **Environment Variables Required**

| Variable | Description | Example |
|----------|-------------|---------|
| `CLIENT_ID` | Spotify App Client ID | `bc674b33178a4ae1bf7627b9ae63508b` |
| `SESSION_SECRET` | Express session secret | `your_secret_key_here` |
| `FRONTEND_URL` | Your Railway app URL | `https://your-app.railway.app` |
| `MONGO_URI` | MongoDB connection string | `mongodb://user:pass@host:port/db` |

## 🚀 **Deployment Commands**

### **Full Deployment**
```bash
# 1. Login to Railway
railway login

# 2. Initialize project
railway init

# 3. Set environment variables
railway variables set CLIENT_ID=your_spotify_client_id
railway variables set SESSION_SECRET=your_session_secret
railway variables set FRONTEND_URL=https://your-app.railway.app

# 4. Deploy
railway up
```

### **Update Deployment**
```bash
# Deploy updates
railway up

# View logs
railway logs

# Check status
railway status
```

## 🔍 **Troubleshooting**

### **Common Issues:**

#### **"Build Failed"**
```bash
# Check build logs
railway logs

# Common fixes:
# 1. Ensure package.json exists in root
# 2. Check Node.js version compatibility
# 3. Verify all dependencies are in package.json
```

#### **"Environment Variables Missing"**
```bash
# List all variables
railway variables

# Set missing variables
railway variables set VARIABLE_NAME=value
```

#### **"Database Connection Failed"**
```bash
# Check MongoDB connection
# 1. Verify MONGO_URI is correct
# 2. Check MongoDB service is running
# 3. Verify network access
```

### **Health Check**
```bash
# Check if app is running
curl https://your-app.railway.app/health

# Should return:
# {"ok": true, "service": "spotify-recommender-backend", "mongo": "connected"}
```

## 📊 **Monitoring**

### **Railway Dashboard**
1. Go to [railway.app](https://railway.app)
2. Select your project
3. View logs, metrics, and status

### **Useful Commands**
```bash
# View real-time logs
railway logs --follow

# Check deployment status
railway status

# View environment variables
railway variables

# Connect to database
railway connect
```

## 🎯 **Post-Deployment Checklist**

- [ ] App is accessible at Railway URL
- [ ] Health endpoint responds: `/health`
- [ ] Spotify OAuth works
- [ ] Database connection is active
- [ ] All environment variables are set
- [ ] Logs show no errors

## 🚀 **Your App Will Be Available At:**
```
https://your-app.railway.app
```

**Ready to deploy to Railway!** 🎉
