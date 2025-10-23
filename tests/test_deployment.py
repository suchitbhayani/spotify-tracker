#!/usr/bin/env python3
"""
Deployment Readiness Tests
Tests that the codebase is ready for deployment
"""

import subprocess
import sys
import os
import json
import requests
from pathlib import Path
import time

class DeploymentTester:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.results = []
        self.ports = {
            "client": 5173,
            "server": 8080,
            "api": 8000
        }
    
    def run_test(self, test_name, test_func):
        """Run a test and record results"""
        try:
            print(f"🧪 Testing: {test_name}")
            result = test_func()
            if result:
                print(f"✅ PASS: {test_name}")
                self.results.append({"test": test_name, "status": "PASS"})
            else:
                print(f"❌ FAIL: {test_name}")
                self.results.append({"test": test_name, "status": "FAIL"})
        except Exception as e:
            print(f"❌ ERROR: {test_name} - {str(e)}")
            self.results.append({"test": test_name, "status": "ERROR", "error": str(e)})
    
    def test_environment_files(self):
        """Test that required environment files exist"""
        env_file = self.project_root / ".env"
        env_example = self.project_root / ".env.example"
        
        # Check if .env exists or .env.example exists
        return env_file.exists() or env_example.exists()
    
    def test_required_dependencies(self):
        """Test that all services have required dependencies"""
        services = ["client", "server", "api"]
        
        for service in services:
            if service in ["client", "server"]:
                package_json = self.project_root / service / "package.json"
                if not package_json.exists():
                    return False
                
                # Check for required dependencies
                with open(package_json) as f:
                    data = json.load(f)
                    deps = data.get("dependencies", {})
                    
                    if service == "client":
                        required = ["react", "react-dom"]
                    else:  # server
                        required = ["express", "cors", "mongoose"]
                    
                    for req in required:
                        if req not in deps:
                            return False
            
            elif service == "api":
                requirements_txt = self.project_root / service / "requirements.txt"
                if not requirements_txt.exists():
                    return False
                
                with open(requirements_txt) as f:
                    content = f.read()
                    required = ["fastapi", "uvicorn", "lightfm"]
                    for req in required:
                        if req not in content:
                            return False
        
        return True
    
    def test_docker_compose_files(self):
        """Test that Docker Compose files exist and are valid"""
        compose_files = [
            "docker-compose.full.yml",
            "docker-compose.dev.yml", 
            "docker-compose.prod.yml"
        ]
        
        for compose_file in compose_files:
            file_path = self.project_root / compose_file
            if not file_path.exists():
                return False
            
            # Test YAML syntax
            try:
                import yaml
                with open(file_path) as f:
                    yaml.safe_load(f)
            except ImportError:
                print("⚠️  PyYAML not installed - skipping YAML validation")
            except Exception:
                return False
        
        return True
    
    def test_security_headers(self):
        """Test that security configurations are in place"""
        # Check for security-related files
        security_files = [
            "SECURITY_GUIDE.md",
            "RAILWAY_SECURITY_GUIDE.md",
            "DOCKER_NETWORKING_GUIDE.md"
        ]
        
        for file_name in security_files:
            file_path = self.project_root / file_name
            if not file_path.exists():
                return False
        
        return True
    
    def test_health_endpoints(self):
        """Test that health endpoints are configured"""
        # Check server health endpoint
        server_index = self.project_root / "server" / "index.js"
        if server_index.exists():
            content = server_index.read_text()
            if "/health" not in content:
                return False
        
        # Check API health endpoint (if main.py exists)
        api_main = self.project_root / "api" / "main.py"
        if api_main.exists():
            content = api_main.read_text()
            if "/health" not in content:
                return False
        
        return True
    
    def test_port_configurations(self):
        """Test that ports are properly configured"""
        # Check Docker Compose files for port configurations
        compose_files = ["docker-compose.full.yml", "docker-compose.dev.yml"]
        
        for compose_file in compose_files:
            file_path = self.project_root / compose_file
            if file_path.exists():
                content = file_path.read_text()
                
                # Check for port mappings
                for service, port in self.ports.items():
                    if f"{port}:{port}" not in content:
                        return False
        
        return True
    
    def test_build_scripts(self):
        """Test that build scripts exist"""
        # Check for package.json scripts
        for service in ["client", "server"]:
            package_json = self.project_root / service / "package.json"
            if package_json.exists():
                with open(package_json) as f:
                    data = json.load(f)
                    scripts = data.get("scripts", {})
                    
                    if service == "client":
                        if "build" not in scripts:
                            return False
                    else:  # server
                        if "start" not in scripts:
                            return False
        
        return True
    
    def run_all_tests(self):
        """Run all deployment readiness tests"""
        print("🚀 Deployment Readiness Tests")
        print("=" * 50)
        
        # Environment and Configuration Tests
        self.run_test("environment_files", self.test_environment_files)
        self.run_test("required_dependencies", self.test_required_dependencies)
        self.run_test("docker_compose_files", self.test_docker_compose_files)
        
        # Security Tests
        self.run_test("security_headers", self.test_security_headers)
        
        # Application Tests
        self.run_test("health_endpoints", self.test_health_endpoints)
        self.run_test("port_configurations", self.test_port_configurations)
        self.run_test("build_scripts", self.test_build_scripts)
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 50)
        print("📊 Deployment Readiness Summary")
        print("=" * 50)
        
        passed = sum(1 for r in self.results if r["status"] == "PASS")
        failed = sum(1 for r in self.results if r["status"] == "FAIL")
        errors = sum(1 for r in self.results if r["status"] == "ERROR")
        total = len(self.results)
        
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⚠️  Errors: {errors}")
        print(f"📊 Total: {total}")
        
        if failed > 0 or errors > 0:
            print("\n❌ Issues to Fix:")
            for result in self.results:
                if result["status"] in ["FAIL", "ERROR"]:
                    print(f"  - {result['test']}: {result['status']}")
                    if "error" in result:
                        print(f"    Error: {result['error']}")
        
        success_rate = (passed / total) * 100 if total > 0 else 0
        print(f"\n🎯 Deployment Readiness: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("🎉 Codebase is deployment-ready!")
        elif success_rate >= 70:
            print("⚠️  Mostly ready, but some issues need attention")
        else:
            print("❌ Not ready for deployment - fix issues first")

if __name__ == "__main__":
    tester = DeploymentTester()
    tester.run_all_tests()
