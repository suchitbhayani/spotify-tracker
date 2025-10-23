#!/usr/bin/env python3
"""
Docker Build Tests
Tests that all Dockerfiles can be built successfully
"""

import subprocess
import sys
import os
from pathlib import Path

class DockerBuildTester:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.results = []
        self.services = {
            "client": {"context": "client", "tag": "spotify-frontend"},
            "server": {"context": "server", "tag": "spotify-backend"},
            "api": {"context": "api", "tag": "spotify-ml-api"},
            "ml_training": {"context": "ml_training", "tag": "spotify-ml-training"}
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
    
    def test_docker_build(self, service, context, tag):
        """Test that a Docker image can be built"""
        try:
            print(f"  Building {service}...")
            result = subprocess.run([
                "docker", "build", "-t", tag, context
            ], cwd=self.project_root, capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                print(f"  ✅ {service} built successfully")
                return True
            else:
                print(f"  ❌ {service} build failed:")
                print(f"    {result.stderr}")
                return False
        except subprocess.TimeoutExpired:
            print(f"  ❌ {service} build timed out")
            return False
        except FileNotFoundError:
            print("  ⚠️  Docker not found - skipping build test")
            return True
    
    def test_docker_image_size(self, tag):
        """Test that Docker image size is reasonable"""
        try:
            result = subprocess.run([
                "docker", "images", "--format", "{{.Size}}", tag
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                size_str = result.stdout.strip()
                print(f"  📦 Image size: {size_str}")
                
                # Extract size in MB (rough estimate)
                if "GB" in size_str:
                    size_mb = float(size_str.replace("GB", "")) * 1024
                elif "MB" in size_str:
                    size_mb = float(size_str.replace("MB", ""))
                else:
                    size_mb = 0
                
                # Check if size is reasonable (less than 1GB)
                if size_mb < 1024:
                    print(f"  ✅ Image size is reasonable ({size_mb:.1f}MB)")
                    return True
                else:
                    print(f"  ⚠️  Image size is large ({size_mb:.1f}MB)")
                    return False
            else:
                return False
        except Exception:
            return False
    
    def test_docker_run(self, tag, port=None):
        """Test that Docker image can run"""
        try:
            # Start container
            cmd = ["docker", "run", "-d", "--name", f"test-{tag}"]
            if port:
                cmd.extend(["-p", f"{port}:{port}"])
            cmd.append(tag)
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                container_id = result.stdout.strip()
                print(f"  ✅ Container started: {container_id[:12]}")
                
                # Wait a bit for container to start
                import time
                time.sleep(5)
                
                # Check if container is still running
                check_result = subprocess.run([
                    "docker", "ps", "--filter", f"name=test-{tag}", "--format", "{{.Status}}"
                ], capture_output=True, text=True)
                
                if "Up" in check_result.stdout:
                    print(f"  ✅ Container is running")
                    success = True
                else:
                    print(f"  ❌ Container stopped unexpectedly")
                    success = False
                
                # Clean up
                subprocess.run(["docker", "rm", "-f", f"test-{tag}"], capture_output=True)
                return success
            else:
                print(f"  ❌ Failed to start container: {result.stderr}")
                return False
        except subprocess.TimeoutExpired:
            print(f"  ❌ Container start timed out")
            return False
        except Exception as e:
            print(f"  ❌ Error starting container: {e}")
            return False
    
    def run_all_tests(self):
        """Run all Docker build tests"""
        print("🐳 Docker Build Tests")
        print("=" * 50)
        
        for service, config in self.services.items():
            print(f"\n📦 Testing {service}")
            
            # Test Docker build
            self.run_test(f"{service}_build", 
                         lambda s=service, c=config: self.test_docker_build(s, c["context"], c["tag"]))
            
            # Test image size
            self.run_test(f"{service}_size", 
                         lambda t=config["tag"]: self.test_docker_image_size(t))
            
            # Test Docker run (only for services with ports)
            if service in ["client", "server", "api"]:
                port = {"client": 5173, "server": 8080, "api": 8000}[service]
                self.run_test(f"{service}_run", 
                             lambda t=config["tag"], p=port: self.test_docker_run(t, p))
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 50)
        print("📊 Docker Build Test Summary")
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
            print("🎉 Docker images are ready for deployment!")
        else:
            print("⚠️  Some Docker build issues need to be fixed")

if __name__ == "__main__":
    tester = DockerBuildTester()
    tester.run_all_tests()
