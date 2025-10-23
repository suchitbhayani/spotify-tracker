#!/bin/bash

# Railway Deployment Script for Spotify Tracker
set -e

echo "🚀 Deploying Spotify Tracker to Railway"
echo "======================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}Step 1: Checking Railway CLI${NC}"
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

echo -e "${BLUE}Step 2: Login to Railway${NC}"
echo "Please login to Railway in your browser..."
railway login

echo -e "${BLUE}Step 3: Initialize Railway Project${NC}"
railway init

echo -e "${BLUE}Step 4: Setting Environment Variables${NC}"
echo "Setting up environment variables..."

# Get current environment variables from .env
if [ -f .env ]; then
    echo "Loading environment variables from .env..."
    
    # Extract CLIENT_ID
    CLIENT_ID=$(grep "CLIENT_ID=" .env | cut -d'=' -f2)
    if [ ! -z "$CLIENT_ID" ]; then
        railway variables set CLIENT_ID="$CLIENT_ID"
        echo "✅ Set CLIENT_ID"
    fi
    
    # Extract SESSION_SECRET
    SESSION_SECRET=$(grep "SESSION_SECRET=" .env | cut -d'=' -f2)
    if [ ! -z "$SESSION_SECRET" ]; then
        railway variables set SESSION_SECRET="$SESSION_SECRET"
        echo "✅ Set SESSION_SECRET"
    fi
    
    # Extract MONGO_URI
    MONGO_URI=$(grep "MONGO_URI=" .env | cut -d'=' -f2)
    if [ ! -z "$MONGO_URI" ]; then
        railway variables set MONGO_URI="$MONGO_URI"
        echo "✅ Set MONGO_URI"
    fi
else
    echo "⚠️  No .env file found. Please set environment variables manually:"
    echo "railway variables set CLIENT_ID=your_spotify_client_id"
    echo "railway variables set SESSION_SECRET=your_session_secret"
    echo "railway variables set MONGO_URI=your_mongodb_uri"
fi

# Set Railway-specific variables
railway variables set NODE_ENV=production
railway variables set PORT=8080
railway variables set FRONTEND_URL=https://your-app.railway.app

echo -e "${BLUE}Step 5: Deploying to Railway${NC}"
railway up

echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "Your app should be available at: https://your-app.railway.app"
echo ""
echo "Useful commands:"
echo "  railway logs          - View logs"
echo "  railway status        - Check status"
echo "  railway variables     - View environment variables"
echo "  railway connect       - Connect to database"
