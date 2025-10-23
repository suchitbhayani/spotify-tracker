#!/bin/bash

# Render Deployment Script for Spotify Tracker
set -e

echo "🚀 Deploying Spotify Tracker to Render"
echo "======================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}Step 1: Checking Git Status${NC}"
if ! git status &> /dev/null; then
    echo "❌ Not in a git repository. Please initialize git first."
    exit 1
fi

echo -e "${BLUE}Step 2: Checking for uncommitted changes${NC}"
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "⚠️  You have uncommitted changes. Please commit them first:"
    echo "   git add ."
    echo "   git commit -m 'Ready for Render deployment'"
    echo "   git push origin main"
    exit 1
fi

echo -e "${BLUE}Step 3: Checking render.yaml configuration${NC}"
if [ ! -f "render.yaml" ]; then
    echo "❌ render.yaml not found. Please ensure it exists."
    exit 1
fi

echo -e "${BLUE}Step 4: Checking package.json configuration${NC}"
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please ensure it exists."
    exit 1
fi

echo -e "${BLUE}Step 5: Pushing to GitHub${NC}"
echo "Pushing latest changes to GitHub..."
git push origin main

echo -e "${GREEN}✅ Code pushed to GitHub successfully!${NC}"

echo -e "\n${YELLOW}📋 Next Steps for Render Deployment:${NC}"
echo "1. Go to https://render.com"
echo "2. Sign up/Login with GitHub"
echo "3. Click 'New +' → 'Web Service'"
echo "4. Connect your repository: spotify-tracker"
echo "5. Configure service:"
echo "   - Name: spotify-tracker-backend"
echo "   - Environment: Node"
echo "   - Build Command: cd server && npm install"
echo "   - Start Command: cd server && npm start"
echo "6. Set environment variables:"
echo "   - NODE_ENV=production"
echo "   - PORT=8080"
echo "   - CLIENT_ID=bc674b33178a4ae1bf7627b9ae63508b"
echo "   - SESSION_SECRET=138b8b219fcee5da97c2c9a5873e87094e17fc7fbd27f88092e7bdc4a63b8bc07d5be5cd5be70bcd948dd7c049a50b466427b32fee6150d3dd7ddd64ea75e9c"
echo "   - MONGO_URI=mongodb+srv://spotify_user:YOUR_PASSWORD@cluster.mongodb.net/spotify_tracker"
echo "   - FRONTEND_URL=https://your-app.onrender.com"
echo "7. Click 'Create Web Service'"

echo -e "\n${GREEN}🎉 Your code is ready for Render deployment!${NC}"
echo "Follow the steps above to complete the deployment."
