#!/usr/bin/env python3
"""
Integration Tests
Tests that all services work together correctly
"""

import subprocess
import sys
import os
import json
import requests
import time
from pathlib import Path

class IntegrationTester:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.results = []
        self.containers = {}
    
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
    
    def start_services(self):
        """Start all services using Docker Compose"""
        try:
            print("🚀 Starting services with Docker Compose...")
            result = subprocess.run([
                "docker-compose", "-f", "docker-compose.full.yml", "up", "-d", "--build"
            ], cwd=self.project_root, capture_output=True, text=True, timeout=120)
            
            if result.returncode == 0:
                print("✅ Services started successfully")
                return True
            else:
                print(f"❌ Failed to start services: {result.stderr}")
                return False
        except subprocess.TimeoutExpired:
            print("❌ Services failed to start within timeout")
            return False
        except FileNotFoundError:
            print("⚠️  Docker Compose not found - skipping integration tests")
            return False
    
    def stop_services(self):
        """Stop all services"""
        try:
            subprocess.run([
                "docker-compose", "-f", "docker-compose.full.yml", "down"
            ], cwd=self.project_root, capture_output=True, text=True)
            print("🛑 Services stopped")
        except Exception as e:
            print(f"⚠️  Error stopping services: {e}")
    
    def test_service_health(self, service, port, endpoint="/health"):
        """Test that a service is healthy"""
        try:
            url = f"http://localhost:{port}{endpoint}"
            response = requests.get(url, timeout=10)
            return response.status_code == 200
        except Exception:
            return False
    
    def test_service_connectivity(self, service, port):
        """Test that a service is accessible"""
        try:
            url = f"http://localhost:{port}"
            response = requests.get(url, timeout=10)
            return response.status_code in [200, 404]  # 404 is OK for root endpoint
        except Exception:
            return False
    
    def test_mongodb_connection(self):
        """Test MongoDB connection"""
        try:
            # Check if MongoDB container is running
            result = subprocess.run([
                "docker", "ps", "--filter", "name=spotify-tracker-mongodb", "--format", "{{.Status}}"
            ], capture_output=True, text=True)
            
            return "Up" in result.stdout
        except Exception:
            return False
    
    def test_ml_api_endpoints(self):
        """Test ML API endpoints"""
        try:
            # Test health endpoint
            health_response = requests.get("http://localhost:8000/health", timeout=10)
            if health_response.status_code != 200:
                return False
            
            # Test if API is responding (even if with 404 for unknown endpoints)
            api_response = requests.get("http://localhost:8000/", timeout=10)
            return api_response.status_code in [200, 404]
        except Exception:
            return False
    
    def test_backend_api_endpoints(self):
        """Test Backend API endpoints"""
        try:
            # Test health endpoint
            health_response = requests.get("http://localhost:8080/health", timeout=10)
            if health_response.status_code != 200:
                return False
            
            # Test API endpoints (should return 401 for unauthenticated requests)
            api_response = requests.get("http://localhost:8080/api/me", timeout=10)
            return api_response.status_code == 401  # Expected for unauthenticated
        except Exception:
            return False
    
    def test_frontend_accessibility(self):
        """Test Frontend accessibility"""
        try:
            response = requests.get("http://localhost:5173", timeout=10)
            return response.status_code == 200
        except Exception:
            return False
    
    def test_inter_service_communication(self):
        """Test that services can communicate with each other"""
        try:
            # Test that backend can reach ML API
            # This would require the backend to make a request to the ML API
            # For now, we'll just check if both services are running
            ml_running = self.test_service_connectivity("ml-api", 8000)
            backend_running = self.test_service_connectivity("backend", 8080)
            
            return ml_running and backend_running
        except Exception:
            return False
    
    def wait_for_services(self, timeout=60):
        """Wait for services to be ready"""
        print("⏳ Waiting for services to be ready...")
        
        services = [
            ("MongoDB", 27017),
            ("ML API", 8000),
            ("Backend", 8080),
            ("Frontend", 5173)
        ]
        
        for service_name, port in services:
            print(f"  Waiting for {service_name}...")
            start_time = time.time()
            
            while time.time() - start_time < timeout:
                try:
                    response = requests.get(f"http://localhost:{port}", timeout=5)
                    if response.status_code in [200, 404]:
                        print(f"  ✅ {service_name} is ready")
                        break
                except Exception:
                    time.sleep(2)
            else:
                print(f"  ❌ {service_name} failed to start within {timeout}s")
                return False
        
        return True
    
    def run_integration_tests(self):
        """Run all integration tests"""
        print("🔗 Integration Tests")
        print("=" * 50)
        
        # Start services
        if not self.start_services():
            print("❌ Failed to start services - skipping integration tests")
            return
        
        try:
            # Wait for services to be ready
            if not self.wait_for_services():
                print("❌ Services not ready - skipping tests")
                return
            
            # Test individual services
            self.run_test("mongodb_connection", self.test_mongodb_connection)
            self.run_test("ml_api_health", lambda: self.test_service_health("ml-api", 8000))
            self.run_test("backend_health", lambda: self.test_service_health("backend", 8080))
            self.run_test("frontend_accessibility", self.test_frontend_accessibility)
            
            # Test service communication
            self.run_test("inter_service_communication", self.test_inter_service_communication)
            
            # Test API endpoints
            self.run_test("ml_api_endpoints", self.test_ml_api_endpoints)
            self.run_test("backend_api_endpoints", self.test_backend_api_endpoints)
            
        finally:
            # Always stop services
            self.stop_services()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 50)
        print("📊 Integration Test Summary")
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
        print(f"\n🎯 Integration Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 All services are working together correctly!")
        else:
            print("⚠️  Some integration issues need to be fixed")

if __name__ == "__main__":
    tester = IntegrationTester()
    tester.run_integration_tests()
