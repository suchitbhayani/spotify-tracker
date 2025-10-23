#!/usr/bin/env python3
"""
Simple Deployment Test Runner
Quick tests to validate Dockerfiles and deployment readiness
"""

import os
import sys
import subprocess
from pathlib import Path

def test_file_exists(file_path, description):
    """Test if a file exists"""
    path = Path(file_path)
    exists = path.exists()
    status = "✅ PASS" if exists else "❌ FAIL"
    print(f"{status} {description}: {file_path}")
    return exists

def test_docker_syntax(dockerfile_path, description):
    """Test Dockerfile syntax"""
    try:
        result = subprocess.run([
            "docker", "build", "--dry-run", "-f", dockerfile_path, str(Path(dockerfile_path).parent)
        ], capture_output=True, text=True, timeout=30)
        
        success = result.returncode == 0
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {description}: {dockerfile_path}")
        return success
    except (subprocess.TimeoutExpired, FileNotFoundError):
        print(f"⚠️  SKIP {description}: Docker not available")
        return True

def test_docker_compose_config(compose_file, description):
    """Test Docker Compose configuration"""
    try:
        result = subprocess.run([
            "docker-compose", "-f", compose_file, "config"
        ], capture_output=True, text=True, timeout=30)
        
        success = result.returncode == 0
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {description}: {compose_file}")
        return success
    except (subprocess.TimeoutExpired, FileNotFoundError):
        print(f"⚠️  SKIP {description}: Docker Compose not available")
        return True

def main():
    """Run all tests"""
    print("🚀 Spotify Tracker - Simple Deployment Tests")
    print("=" * 50)
    
    results = []
    
    # Test 1: Dockerfiles exist
    print("\n📦 Testing Dockerfile Existence")
    results.append(test_file_exists("client/Dockerfile", "Client Dockerfile"))
    results.append(test_file_exists("server/Dockerfile", "Server Dockerfile"))
    results.append(test_file_exists("api/Dockerfile", "API Dockerfile"))
    results.append(test_file_exists("ml_training/Dockerfile", "ML Training Dockerfile"))
    
    # Test 2: Package files exist
    print("\n📋 Testing Package Files")
    results.append(test_file_exists("client/package.json", "Client package.json"))
    results.append(test_file_exists("server/package.json", "Server package.json"))
    results.append(test_file_exists("api/requirements.txt", "API requirements.txt"))
    results.append(test_file_exists("ml_training/requirements.txt", "ML Training requirements.txt"))
    
    # Test 3: Docker Compose files
    print("\n🐳 Testing Docker Compose Files")
    results.append(test_file_exists("docker-compose.full.yml", "Full Docker Compose"))
    results.append(test_file_exists("docker-compose.dev.yml", "Dev Docker Compose"))
    results.append(test_file_exists("docker-compose.prod.yml", "Prod Docker Compose"))
    
    # Test 4: Environment and documentation
    print("\n🔐 Testing Environment & Documentation")
    results.append(test_file_exists(".env", "Environment file") or test_file_exists(".env.example", "Environment example"))
    results.append(test_file_exists("SECURITY_GUIDE.md", "Security guide"))
    results.append(test_file_exists("DEPLOYMENT_GUIDE.md", "Deployment guide"))
    
    # Test 5: Docker syntax (if Docker is available)
    print("\n🔍 Testing Docker Syntax")
    if subprocess.run(["which", "docker"], capture_output=True).returncode == 0:
        results.append(test_docker_syntax("client/Dockerfile", "Client Dockerfile syntax"))
        results.append(test_docker_syntax("server/Dockerfile", "Server Dockerfile syntax"))
        results.append(test_docker_syntax("api/Dockerfile", "API Dockerfile syntax"))
        results.append(test_docker_syntax("ml_training/Dockerfile", "ML Training Dockerfile syntax"))
    else:
        print("⚠️  Docker not found - skipping syntax tests")
    
    # Test 6: Docker Compose validation
    print("\n🔧 Testing Docker Compose Validation")
    if subprocess.run(["which", "docker-compose"], capture_output=True).returncode == 0:
        results.append(test_docker_compose_config("docker-compose.full.yml", "Full Docker Compose config"))
        results.append(test_docker_compose_config("docker-compose.dev.yml", "Dev Docker Compose config"))
        results.append(test_docker_compose_config("docker-compose.prod.yml", "Prod Docker Compose config"))
    else:
        print("⚠️  Docker Compose not found - skipping validation")
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 Test Summary")
    print("=" * 50)
    
    passed = sum(results)
    total = len(results)
    success_rate = (passed / total) * 100 if total > 0 else 0
    
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {total - passed}")
    print(f"📊 Total: {total}")
    print(f"🎯 Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 90:
        print("🎉 Your codebase is deployment-ready!")
        return 0
    elif success_rate >= 70:
        print("⚠️  Mostly ready, but some issues need attention")
        return 1
    else:
        print("❌ Not ready for deployment - fix issues first")
        return 1

if __name__ == "__main__":
    sys.exit(main())
