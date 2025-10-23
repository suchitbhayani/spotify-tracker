#!/usr/bin/env python3
"""
Master Test Runner
Runs all tests to validate Dockerfiles and deployment readiness
"""

import sys
import subprocess
from pathlib import Path

def run_test_suite(test_file, test_name):
    """Run a test suite and return results"""
    print(f"\n{'='*60}")
    print(f"🧪 Running {test_name}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run([
            sys.executable, test_file
        ], cwd=Path(__file__).parent, capture_output=True, text=True)
        
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        
        return result.returncode == 0
    except Exception as e:
        print(f"❌ Error running {test_name}: {e}")
        return False

def main():
    """Run all test suites"""
    print("🚀 Spotify Tracker - Complete Test Suite")
    print("=" * 60)
    
    tests = [
        ("test_dockerfiles.py", "Dockerfile Validation Tests"),
        ("test_deployment.py", "Deployment Readiness Tests"),
        ("test_integration.py", "Integration Tests")
    ]
    
    results = {}
    
    for test_file, test_name in tests:
        test_path = Path(__file__).parent / test_file
        if test_path.exists():
            success = run_test_suite(test_path, test_name)
            results[test_name] = success
        else:
            print(f"⚠️  Test file not found: {test_file}")
            results[test_name] = False
    
    # Print final summary
    print(f"\n{'='*60}")
    print("📊 FINAL TEST SUMMARY")
    print(f"{'='*60}")
    
    passed = sum(1 for success in results.values() if success)
    total = len(results)
    
    for test_name, success in results.items():
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n🎯 Overall Success Rate: {passed}/{total} ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED! Your codebase is deployment-ready!")
        return 0
    else:
        print("⚠️  Some tests failed. Please fix issues before deployment.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
