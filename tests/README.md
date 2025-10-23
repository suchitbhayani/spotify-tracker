# 🧪 Test Suite for Spotify Tracker

This directory contains comprehensive tests to validate your Dockerfiles and ensure your codebase is deployment-ready.

## 📋 **Test Files Overview**

| Test File | Purpose | What It Tests |
|-----------|---------|---------------|
| `test_dockerfiles.py` | Dockerfile Validation | Dockerfile syntax, content, and structure |
| `test_deployment.py` | Deployment Readiness | Environment files, dependencies, security |
| `test_integration.py` | Integration Tests | Service communication and health checks |
| `test_docker_build.py` | Docker Build Tests | Actual Docker image building and running |
| `run_all_tests.py` | Master Test Runner | Runs all tests in sequence |

## 🚀 **Quick Start**

### **Install Test Dependencies**
```bash
pip install -r tests/requirements.txt
```

### **Run All Tests**
```bash
python tests/run_all_tests.py
```

### **Run Individual Test Suites**
```bash
# Test Dockerfile validation
python tests/test_dockerfiles.py

# Test deployment readiness
python tests/test_deployment.py

# Test Docker builds (requires Docker)
python tests/test_docker_build.py

# Test integration (requires Docker)
python tests/test_integration.py
```

## 🔍 **What Each Test Validates**

### **1. Dockerfile Validation (`test_dockerfiles.py`)**
- ✅ Dockerfile exists for each service
- ✅ Dockerfile syntax is valid
- ✅ Required content is present (FROM, EXPOSE, CMD)
- ✅ Package files exist (package.json, requirements.txt)

### **2. Deployment Readiness (`test_deployment.py`)**
- ✅ Environment files exist (.env or .env.example)
- ✅ Required dependencies are present
- ✅ Docker Compose files are valid
- ✅ Security configurations are in place
- ✅ Health endpoints are configured
- ✅ Port configurations are correct

### **3. Docker Build Tests (`test_docker_build.py`)**
- ✅ All Dockerfiles can be built successfully
- ✅ Docker images are reasonable size
- ✅ Docker containers can start and run
- ✅ Services are accessible on correct ports

### **4. Integration Tests (`test_integration.py`)**
- ✅ All services start with Docker Compose
- ✅ Services are healthy and accessible
- ✅ Inter-service communication works
- ✅ API endpoints respond correctly

## 📊 **Test Results Interpretation**

### **Success Rates**
- **90%+**: 🎉 Deployment-ready!
- **70-89%**: ⚠️ Mostly ready, minor issues
- **<70%**: ❌ Not ready, fix issues first

### **Common Issues & Solutions**

#### **Dockerfile Issues**
```bash
# Fix Dockerfile syntax
docker build --dry-run -f client/Dockerfile client/

# Check for missing dependencies
grep -r "FROM\|EXPOSE\|CMD" client/Dockerfile
```

#### **Missing Dependencies**
```bash
# Install missing packages
npm install  # For Node.js services
pip install -r api/requirements.txt  # For Python services
```

#### **Environment Issues**
```bash
# Create .env file
cp .env.example .env
# Edit .env with your values
```

#### **Docker Issues**
```bash
# Check Docker is running
docker --version
docker ps

# Clean up containers
docker-compose down
docker system prune -f
```

## 🛠️ **Troubleshooting**

### **Test Dependencies**
```bash
# Install Python dependencies
pip install requests PyYAML

# Install Node.js dependencies
npm install

# Install Python ML dependencies
pip install -r api/requirements.txt
```

### **Docker Issues**
```bash
# Check Docker status
docker --version
docker-compose --version

# Clean Docker system
docker system prune -f
docker volume prune -f
```

### **Port Conflicts**
```bash
# Check what's using ports
netstat -tulpn | grep :5173
netstat -tulpn | grep :8080
netstat -tulpn | grep :8000

# Kill processes using ports
sudo lsof -ti:5173 | xargs kill -9
```

## 📈 **Continuous Integration**

### **GitHub Actions Example**
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.9
      - name: Install dependencies
        run: pip install -r tests/requirements.txt
      - name: Run tests
        run: python tests/run_all_tests.py
```

### **Pre-commit Hook**
```bash
# Install pre-commit
pip install pre-commit

# Create .pre-commit-config.yaml
cat > .pre-commit-config.yaml << EOF
repos:
  - repo: local
    hooks:
      - id: test-suite
        name: Run test suite
        entry: python tests/run_all_tests.py
        language: system
        pass_filenames: false
EOF

# Install hook
pre-commit install
```

## 🎯 **Best Practices**

### **Before Deployment**
1. ✅ Run all tests: `python tests/run_all_tests.py`
2. ✅ Fix any failing tests
3. ✅ Test Docker Compose: `docker-compose -f docker-compose.full.yml up --build`
4. ✅ Verify all services are accessible
5. ✅ Check logs for errors

### **Regular Testing**
- Run tests before each commit
- Run tests in CI/CD pipeline
- Monitor test results over time
- Update tests when adding new features

## 🚨 **Troubleshooting Common Issues**

### **"Docker not found"**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in
```

### **"Port already in use"**
```bash
# Find and kill process
sudo lsof -ti:5173 | xargs kill -9
sudo lsof -ti:8080 | xargs kill -9
sudo lsof -ti:8000 | xargs kill -9
```

### **"Permission denied"**
```bash
# Make test files executable
chmod +x tests/*.py

# Run with Python
python tests/run_all_tests.py
```

**Your test suite is now ready to validate your deployment!** 🎉
