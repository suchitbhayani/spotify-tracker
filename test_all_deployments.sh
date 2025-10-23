#!/bin/bash

# Comprehensive Deployment Test Suite
# Tests all deployment configurations (Docker, Railway, etc.)

set -e

echo "🚀 Comprehensive Deployment Test Suite"
echo "========================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Test counters
TOTAL_PASSED=0
TOTAL_FAILED=0
TOTAL_TESTS=0

# Function to run a test suite
run_test_suite() {
    local suite_name="$1"
    local test_command="$2"
    
    echo -e "\n${YELLOW}🧪 Running: $suite_name${NC}"
    echo "----------------------------------------"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ $suite_name: PASSED${NC}"
        TOTAL_PASSED=$((TOTAL_PASSED + 1))
    else
        echo -e "${RED}❌ $suite_name: FAILED${NC}"
        TOTAL_FAILED=$((TOTAL_FAILED + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Test 1: Basic deployment readiness
echo -e "\n${BLUE}📋 Testing Basic Deployment Readiness${NC}"
run_test_suite "Basic Deployment Test" "./test_deployment.sh"

# Test 2: Railway configuration
echo -e "\n${BLUE}🚀 Testing Railway Configuration${NC}"
run_test_suite "Railway Config Test" "python test_railway_config.py"

# Test 3: Railway deployment dry run
echo -e "\n${BLUE}🧪 Testing Railway Deployment Dry Run${NC}"
run_test_suite "Railway Dry Run Test" "./test_deployment_dry_run.sh"

# Test 4: Docker configurations
echo -e "\n${BLUE}🐳 Testing Docker Configurations${NC}"
run_test_suite "Docker Config Test" "python test_simple.py"

# Test 5: Environment validation
echo -e "\n${BLUE}🔐 Testing Environment Configuration${NC}"
run_test_suite "Environment Test" "[ -f .env ] && grep -q 'CLIENT_ID=' .env && grep -q 'SESSION_SECRET=' .env && grep -q 'MONGO_URI=' .env"

# Test 6: Service health checks
echo -e "\n${BLUE}🏥 Testing Service Health Checks${NC}"
run_test_suite "Health Check Test" "grep -q '/health' server/index.js && grep -q 'res.json' server/index.js"

# Test 7: Security configurations
echo -e "\n${BLUE}🔒 Testing Security Configurations${NC}"
run_test_suite "Security Test" "[ -f SECURITY_GUIDE.md ] && [ -f RAILWAY_SECURITY_GUIDE.md ] && [ -f DEPLOYMENT_GUIDE.md ]"

# Test 8: Documentation completeness
echo -e "\n${BLUE}📚 Testing Documentation${NC}"
run_test_suite "Documentation Test" "[ -f README.md ] && [ -f TEST_SUMMARY.md ] && [ -f RAILWAY_DEPLOYMENT.md ]"

# Print final comprehensive summary
echo -e "\n${BLUE}=========================================="
echo -e "📊 COMPREHENSIVE DEPLOYMENT TEST SUMMARY"
echo -e "==========================================${NC}"
echo -e "${GREEN}✅ Passed: $TOTAL_PASSED${NC}"
echo -e "${RED}❌ Failed: $TOTAL_FAILED${NC}"
echo -e "${BLUE}📊 Total: $TOTAL_TESTS${NC}"

SUCCESS_RATE=$((TOTAL_PASSED * 100 / TOTAL_TESTS))
echo -e "${BLUE}🎯 Overall Success Rate: $SUCCESS_RATE%${NC}"

# Deployment readiness assessment
if [ $SUCCESS_RATE -ge 90 ]; then
    echo -e "\n${GREEN}🎉 DEPLOYMENT READY!${NC}"
    echo -e "${GREEN}Your application is ready for deployment to:${NC}"
    echo -e "${GREEN}  • Railway: ./deploy_railway.sh${NC}"
    echo -e "${GREEN}  • Docker: docker-compose -f docker-compose.full.yml up --build${NC}"
    echo -e "${GREEN}  • Development: docker-compose -f docker-compose.dev.yml up --build${NC}"
    exit 0
elif [ $SUCCESS_RATE -ge 70 ]; then
    echo -e "\n${YELLOW}⚠️  MOSTLY READY${NC}"
    echo -e "${YELLOW}Some issues need attention before deployment${NC}"
    exit 1
else
    echo -e "\n${RED}❌ NOT READY${NC}"
    echo -e "${RED}Fix issues before attempting deployment${NC}"
    exit 1
fi
