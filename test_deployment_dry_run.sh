#!/bin/bash

# Railway Deployment Dry Run Test
# Tests deployment configuration without actually deploying

set -e

echo "🧪 Railway Deployment Dry Run Test"
echo "=================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

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

# Test 1: Required files exist
echo -e "\n${YELLOW}📁 Testing Required Files${NC}"
run_test "Root package.json exists" "[ -f package.json ]"
run_test "Railway config exists" "[ -f railway.json ]"
run_test "Deployment script exists" "[ -f deploy_railway.sh ]"
run_test "Environment file exists" "[ -f .env ]"

# Test 2: JSON syntax validation
echo -e "\n${YELLOW}🔍 Testing JSON Syntax${NC}"
run_test "package.json syntax" "python -c 'import json; json.load(open(\"package.json\"))'"
run_test "railway.json syntax" "python -c 'import json; json.load(open(\"railway.json\"))'"

# Test 3: Railway CLI availability
echo -e "\n${YELLOW}🛠️  Testing Railway CLI${NC}"
run_test "Railway CLI installed" "railway --version > /dev/null 2>&1"

# Test 4: Environment variables
echo -e "\n${YELLOW}🔐 Testing Environment Variables${NC}"
run_test "CLIENT_ID is set" "grep -q 'CLIENT_ID=' .env && grep -q 'CLIENT_ID=[^[:space:]]' .env"
run_test "SESSION_SECRET is set" "grep -q 'SESSION_SECRET=' .env && grep -q 'SESSION_SECRET=[^[:space:]]' .env"
run_test "MONGO_URI is set" "grep -q 'MONGO_URI=' .env && grep -q 'MONGO_URI=[^[:space:]]' .env"

# Test 5: Package.json configuration
echo -e "\n${YELLOW}📦 Testing Package Configuration${NC}"
run_test "Start script exists" "grep -q '\"start\"' package.json"
run_test "Build script exists" "grep -q '\"build\"' package.json"
run_test "Node.js version specified" "grep -q '\"node\"' package.json"

# Test 6: Railway configuration
echo -e "\n${YELLOW}⚙️  Testing Railway Configuration${NC}"
run_test "Railway builder specified" "grep -q '\"builder\"' railway.json"
run_test "Startup command specified" "grep -q '\"startupCommand\"' railway.json"
run_test "Environment variables configured" "grep -q '\"environment\"' railway.json"

# Test 7: Deployment script validation
echo -e "\n${YELLOW}📜 Testing Deployment Script${NC}"
run_test "Deployment script is executable" "[ -x deploy_railway.sh ]"
run_test "Script contains railway login" "grep -q 'railway login' deploy_railway.sh"
run_test "Script contains railway init" "grep -q 'railway init' deploy_railway.sh"
run_test "Script contains railway up" "grep -q 'railway up' deploy_railway.sh"

# Test 8: Service configurations
echo -e "\n${YELLOW}🔧 Testing Service Configurations${NC}"
run_test "Server package.json exists" "[ -f server/package.json ]"
run_test "Client package.json exists" "[ -f client/package.json ]"
run_test "API requirements.txt exists" "[ -f api/requirements.txt ]"

# Test 9: Docker configurations (optional)
echo -e "\n${YELLOW}🐳 Testing Docker Configurations${NC}"
run_test "Client Dockerfile exists" "[ -f client/Dockerfile ]"
run_test "Server Dockerfile exists" "[ -f server/Dockerfile ]"
run_test "API Dockerfile exists" "[ -f api/Dockerfile ]"

# Test 10: Health check endpoint
echo -e "\n${YELLOW}🏥 Testing Health Check Configuration${NC}"
run_test "Health check path configured" "grep -q '\"healthcheckPath\"' railway.json"
run_test "Server has health endpoint" "grep -q '/health' server/index.js"

# Print final summary
echo -e "\n${BLUE}=========================================="
echo -e "📊 RAILWAY DEPLOYMENT DRY RUN SUMMARY"
echo -e "==========================================${NC}"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo -e "${BLUE}📊 Total: $TOTAL${NC}"

SUCCESS_RATE=$((PASSED * 100 / TOTAL))
echo -e "${BLUE}🎯 Success Rate: $SUCCESS_RATE%${NC}"

if [ $SUCCESS_RATE -ge 90 ]; then
    echo -e "${GREEN}🎉 Railway deployment configuration is ready!${NC}"
    echo -e "${GREEN}You can now run: ./deploy_railway.sh${NC}"
    exit 0
elif [ $SUCCESS_RATE -ge 70 ]; then
    echo -e "${YELLOW}⚠️  Mostly ready, but some issues need attention${NC}"
    exit 1
else
    echo -e "${RED}❌ Not ready for Railway deployment - fix issues first${NC}"
    exit 1
fi
