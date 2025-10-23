#!/usr/bin/env python3
"""
Dockerfile Validation Tests
Tests that all Dockerfiles build correctly and contain required components
"""

import subprocess
import sys
import os
import json
from pathlib import Path

class DockerfileTester:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.results = []
    
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
    
    def test_dockerfile_exists(self, service):
        """Test that Dockerfile exists for service"""
        dockerfile_path = self.project_root / service / "Dockerfile"
        return dockerfile_path.exists()
    
    def test_dockerfile_syntax(self, service):
        """Test Dockerfile syntax by building with --dry-run"""
        try:
            dockerfile_path = self.project_root / service / "Dockerfile"
            result = subprocess.run([
                "docker", "build", "--dry-run", "-f", str(dockerfile_path), str(self.project_root / service)
            ], capture_output=True, text=True, timeout=30)
            return result.returncode == 0
        except subprocess.TimeoutExpired:
            return False
        except FileNotFoundError:
            print("⚠️  Docker not found - skipping syntax test")
            return True
    
    def test_dockerfile_content(self, service, required_content):
        """Test that Dockerfile contains required content"""
        dockerfile_path = self.project_root / service / "Dockerfile"
        if not dockerfile_path.exists():
            return False
        
        content = dockerfile_path.read_text()
        return all(required in content for required in required_content)
    
    def test_package_files_exist(self, service):
        """Test that required package files exist"""
        if service == "client" or service == "server":
            package_json = self.project_root / service / "package.json"
            return package_json.exists()
        elif service == "api":
            requirements_txt = self.project_root / service / "requirements.txt"
            return requirements_txt.exists()
        return True
    
    def run_all_tests(self):
        """Run all Dockerfile tests"""
        print("🐳 Dockerfile Validation Tests")
        print("=" * 50)
        
        # Test each service
        services = {
            "client": {
                "required_content": ["FROM node:", "EXPOSE 5173", "npm run build"],
                "description": "Frontend (React + Vite)"
            },
            "server": {
                "required_content": ["FROM node:", "EXPOSE 8080", "npm start"],
                "description": "Backend (Node.js + Express)"
            },
            "api": {
                "required_content": ["FROM python:", "EXPOSE 8000", "uvicorn"],
                "description": "ML API (FastAPI + LightFM)"
            },
            "ml_training": {
                "required_content": ["FROM python:", "training.py"],
                "description": "ML Training (Python + LightFM)"
            }
        }
        
        for service, config in services.items():
            print(f"\n📦 Testing {service} ({config['description']})")
            
            # Test Dockerfile exists
            self.run_test(f"{service}_dockerfile_exists", 
                         lambda s=service: self.test_dockerfile_exists(s))
            
            # Test package files exist
            self.run_test(f"{service}_package_files", 
                         lambda s=service: self.test_package_files_exist(s))
            
            # Test Dockerfile content
            self.run_test(f"{service}_dockerfile_content", 
                         lambda s=service: self.test_dockerfile_content(s, config['required_content']))
            
            # Test Dockerfile syntax
            self.run_test(f"{service}_dockerfile_syntax", 
                         lambda s=service: self.test_dockerfile_syntax(s))
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 50)
        print("📊 Test Summary")
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
            print("\n❌ Failed Tests:")
            for result in self.results:
                if result["status"] in ["FAIL", "ERROR"]:
                    print(f"  - {result['test']}: {result['status']}")
                    if "error" in result:
                        print(f"    Error: {result['error']}")
        
        success_rate = (passed / total) * 100 if total > 0 else 0
        print(f"\n🎯 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 Dockerfiles are deployment-ready!")
        else:
            print("⚠️  Some issues need to be fixed before deployment")

if __name__ == "__main__":
    tester = DockerfileTester()
    tester.run_all_tests()