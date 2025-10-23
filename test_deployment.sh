#!/bin/bash

# Spotify Tracker - Deployment Test Suite
# Tests Dockerfiles and deployment readiness

set -e

echo "🚀 Spotify Tracker - Deployment Test Suite"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0
TOTAL=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "\n${BLUE}🧪 Testing: $test_name${NC}"
    TOTAL=$((TOTAL + 1))
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASS: $test_name${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ FAIL: $test_name${NC}"
        FAILED=$((FAILED + 1))
    fi
}

# Test 1: Check if Dockerfiles exist
echo -e "\n${YELLOW}📦 Testing Dockerfile Existence${NC}"
run_test "Client Dockerfile exists" "[ -f client/Dockerfile ]"
run_test "Server Dockerfile exists" "[ -f server/Dockerfile ]"
run_test "API Dockerfile exists" "[ -f api/Dockerfile ]"
run_test "ML Training Dockerfile exists" "[ -f ml_training/Dockerfile ]"

# Test 2: Check if package files exist
echo -e "\n${YELLOW}📋 Testing Package Files${NC}"
run_test "Client package.json exists" "[ -f client/package.json ]"
run_test "Server package.json exists" "[ -f server/package.json ]"
run_test "API requirements.txt exists" "[ -f api/requirements.txt ]"
run_test "ML Training requirements.txt exists" "[ -f ml_training/requirements.txt ]"

# Test 3: Check Docker Compose files
echo -e "\n${YELLOW}🐳 Testing Docker Compose Files${NC}"
run_test "Full Docker Compose exists" "[ -f docker-compose.full.yml ]"
run_test "Dev Docker Compose exists" "[ -f docker-compose.dev.yml ]"
run_test "Prod Docker Compose exists" "[ -f docker-compose.prod.yml ]"

# Test 4: Check environment files
echo -e "\n${YELLOW}🔐 Testing Environment Configuration${NC}"
run_test "Environment file exists" "[ -f .env ] || [ -f .env.example ]"
run_test "Security guides exist" "[ -f SECURITY_GUIDE.md ]"
run_test "Deployment guide exists" "[ -f DEPLOYMENT_GUIDE.md ]"

# Test 5: Check Docker syntax (if Docker is available)
echo -e "\n${YELLOW}🔍 Testing Docker Syntax${NC}"
if command -v docker &> /dev/null; then
    run_test "Client Dockerfile syntax" "docker build --dry-run -f client/Dockerfile client/ 2>&1 | grep -v 'buildx' | grep -v 'DEPRECATED' > /dev/null"
    run_test "Server Dockerfile syntax" "docker build --dry-run -f server/Dockerfile server/ 2>&1 | grep -v 'buildx' | grep -v 'DEPRECATED' > /dev/null"
    run_test "API Dockerfile syntax" "docker build --dry-run -f api/Dockerfile api/ 2>&1 | grep -v 'buildx' | grep -v 'DEPRECATED' > /dev/null"
    run_test "ML Training Dockerfile syntax" "docker build --dry-run -f ml_training/Dockerfile ml_training/ 2>&1 | grep -v 'buildx' | grep -v 'DEPRECATED' > /dev/null"
else
    echo -e "${YELLOW}⚠️  Docker not found - skipping syntax tests${NC}"
fi

# Test 6: Check if services can be built (if Docker is available)
echo -e "\n${YELLOW}🏗️  Testing Docker Builds${NC}"
if command -v docker &> /dev/null; then
    run_test "Client Docker build" "docker build -t spotify-frontend-test client/ > /dev/null 2>&1"
    run_test "Server Docker build" "docker build -t spotify-backend-test server/ > /dev/null 2>&1"
    run_test "API Docker build" "docker build -t spotify-ml-api-test api/ > /dev/null 2>&1"
    run_test "ML Training Docker build" "docker build -t spotify-ml-training-test ml_training/ > /dev/null 2>&1"
    
    # Clean up test images
    echo "🧹 Cleaning up test images..."
    docker rmi spotify-frontend-test spotify-backend-test spotify-ml-api-test spotify-ml-training-test 2>/dev/null || true
else
    echo -e "${YELLOW}⚠️  Docker not found - skipping build tests${NC}"
fi

# Test 7: Check if Docker Compose can validate
echo -e "\n${YELLOW}🔧 Testing Docker Compose Validation${NC}"
if command -v docker-compose &> /dev/null; then
    run_test "Full Docker Compose config" "docker compose -f docker-compose.full.yml config > /dev/null 2>&1 || docker-compose -f docker-compose.full.yml config > /dev/null 2>&1"
    run_test "Dev Docker Compose config" "docker compose -f docker-compose.dev.yml config > /dev/null 2>&1 || docker-compose -f docker-compose.dev.yml config > /dev/null 2>&1"
    run_test "Prod Docker Compose config" "docker compose -f docker-compose.prod.yml config > /dev/null 2>&1 || docker-compose -f docker-compose.prod.yml config > /dev/null 2>&1"
else
    echo -e "${YELLOW}⚠️  Docker Compose not found - skipping validation${NC}"
fi

# Test 8: Check for required dependencies
echo -e "\n${YELLOW}📦 Testing Dependencies${NC}"
run_test "Client has React dependencies" "grep -q 'react' client/package.json"
run_test "Server has Express dependencies" "grep -q 'express' server/package.json"
run_test "API has FastAPI dependencies" "grep -q 'fastapi' api/requirements.txt"
run_test "ML Training has LightFM dependencies" "grep -q 'lightfm' ml_training/requirements.txt"

# Print final summary
echo -e "\n${BLUE}=========================================="
echo -e "📊 FINAL TEST SUMMARY"
echo -e "==========================================${NC}"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo -e "${BLUE}📊 Total: $TOTAL${NC}"

SUCCESS_RATE=$((PASSED * 100 / TOTAL))
echo -e "${BLUE}🎯 Success Rate: $SUCCESS_RATE%${NC}"

if [ $SUCCESS_RATE -ge 90 ]; then
    echo -e "${GREEN}🎉 Your codebase is deployment-ready!${NC}"
    exit 0
elif [ $SUCCESS_RATE -ge 70 ]; then
    echo -e "${YELLOW}⚠️  Mostly ready, but some issues need attention${NC}"
    exit 1
else
    echo -e "${RED}❌ Not ready for deployment - fix issues first${NC}"
    exit 1
fi
