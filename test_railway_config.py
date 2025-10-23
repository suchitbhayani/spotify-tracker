#!/usr/bin/env python3
"""
Railway Configuration Test
Tests Railway deployment configuration without actually deploying
"""

import json
import os
import subprocess
import sys
from pathlib import Path

def test_file_exists(file_path, description):
    """Test if a file exists"""
    path = Path(file_path)
    exists = path.exists()
    status = "✅ PASS" if exists else "❌ FAIL"
    print(f"{status} {description}: {file_path}")
    return exists

def test_json_syntax(file_path, description):
    """Test JSON file syntax"""
    try:
        with open(file_path) as f:
            json.load(f)
        print(f"✅ PASS {description}: {file_path}")
        return True
    except json.JSONDecodeError as e:
        print(f"❌ FAIL {description}: {file_path} - {e}")
        return False
    except FileNotFoundError:
        print(f"❌ FAIL {description}: {file_path} - File not found")
        return False

def test_package_json():
    """Test root package.json configuration"""
    try:
        with open("package.json") as f:
            data = json.load(f)
        
        # Check required fields
        required_fields = ["name", "scripts", "engines"]
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            print(f"❌ FAIL package.json: Missing fields {missing_fields}")
            return False
        
        # Check scripts
        required_scripts = ["start", "build"]
        missing_scripts = [script for script in required_scripts if script not in data.get("scripts", {})]
        
        if missing_scripts:
            print(f"❌ FAIL package.json: Missing scripts {missing_scripts}")
            return False
        
        # Check Node.js version
        node_version = data.get("engines", {}).get("node", "")
        if not node_version:
            print("⚠️  WARN package.json: No Node.js version specified")
        else:
            print(f"✅ PASS package.json: Node.js version {node_version}")
        
        print("✅ PASS package.json: All required fields present")
        return True
        
    except Exception as e:
        print(f"❌ FAIL package.json: {e}")
        return False

def test_railway_json():
    """Test railway.json configuration"""
    try:
        with open("railway.json") as f:
            data = json.load(f)
        
        # Check required fields
        required_fields = ["build", "deploy"]
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            print(f"❌ FAIL railway.json: Missing fields {missing_fields}")
            return False
        
        # Check build configuration
        build_config = data.get("build", {})
        if "builder" not in build_config:
            print("❌ FAIL railway.json: No builder specified")
            return False
        
        # Check deploy configuration
        deploy_config = data.get("deploy", {})
        required_deploy_fields = ["startupCommand"]
        missing_deploy = [field for field in required_deploy_fields if field not in deploy_config]
        
        if missing_deploy:
            print(f"❌ FAIL railway.json: Missing deploy fields {missing_deploy}")
            return False
        
        print("✅ PASS railway.json: Configuration valid")
        return True
        
    except Exception as e:
        print(f"❌ FAIL railway.json: {e}")
        return False

def test_environment_variables():
    """Test environment variables"""
    env_file = Path(".env")
    if not env_file.exists():
        print("❌ FAIL Environment: No .env file found")
        return False
    
    # Read .env file
    env_vars = {}
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                env_vars[key] = value
    
    # Check required variables
    required_vars = ["CLIENT_ID", "SESSION_SECRET", "MONGO_URI"]
    missing_vars = [var for var in required_vars if var not in env_vars]
    
    if missing_vars:
        print(f"❌ FAIL Environment: Missing variables {missing_vars}")
        return False
    
    # Check if variables have values
    empty_vars = [var for var in required_vars if not env_vars.get(var, "").strip()]
    if empty_vars:
        print(f"❌ FAIL Environment: Empty variables {empty_vars}")
        return False
    
    print("✅ PASS Environment: All required variables present")
    return True

def test_railway_cli():
    """Test Railway CLI availability"""
    try:
        result = subprocess.run(["railway", "--version"], capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"✅ PASS Railway CLI: {version}")
            return True
        else:
            print("❌ FAIL Railway CLI: Command failed")
            return False
    except FileNotFoundError:
        print("❌ FAIL Railway CLI: Not installed")
        return False
    except subprocess.TimeoutExpired:
        print("❌ FAIL Railway CLI: Command timed out")
        return False
    except Exception as e:
        print(f"❌ FAIL Railway CLI: {e}")
        return False

def test_deployment_script():
    """Test deployment script"""
    script_path = Path("deploy_railway.sh")
    if not script_path.exists():
        print("❌ FAIL Deployment script: deploy_railway.sh not found")
        return False
    
    # Check if script is executable
    if not os.access(script_path, os.X_OK):
        print("❌ FAIL Deployment script: Not executable")
        return False
    
    # Check script content
    with open(script_path) as f:
        content = f.read()
    
    required_commands = ["railway login", "railway init", "railway up"]
    missing_commands = [cmd for cmd in required_commands if cmd not in content]
    
    if missing_commands:
        print(f"❌ FAIL Deployment script: Missing commands {missing_commands}")
        return False
    
    print("✅ PASS Deployment script: Valid and executable")
    return True

def main():
    """Run all Railway configuration tests"""
    print("🚀 Railway Configuration Test")
    print("=" * 50)
    
    results = []
    
    # Test 1: Required files
    print("\n📁 Testing Required Files")
    results.append(test_file_exists("package.json", "Root package.json"))
    results.append(test_file_exists("railway.json", "Railway configuration"))
    results.append(test_file_exists("deploy_railway.sh", "Deployment script"))
    results.append(test_file_exists(".env", "Environment file"))
    
    # Test 2: JSON syntax
    print("\n🔍 Testing JSON Syntax")
    results.append(test_json_syntax("package.json", "package.json syntax"))
    results.append(test_json_syntax("railway.json", "railway.json syntax"))
    
    # Test 3: Configuration validation
    print("\n⚙️  Testing Configuration")
    results.append(test_package_json())
    results.append(test_railway_json())
    results.append(test_environment_variables())
    
    # Test 4: Railway CLI
    print("\n🛠️  Testing Railway CLI")
    results.append(test_railway_cli())
    
    # Test 5: Deployment script
    print("\n📜 Testing Deployment Script")
    results.append(test_deployment_script())
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 Railway Configuration Test Summary")
    print("=" * 50)
    
    passed = sum(results)
    total = len(results)
    success_rate = (passed / total) * 100 if total > 0 else 0
    
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {total - passed}")
    print(f"📊 Total: {total}")
    print(f"🎯 Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 90:
        print("🎉 Railway configuration is ready for deployment!")
        return 0
    elif success_rate >= 70:
        print("⚠️  Mostly ready, but some issues need attention")
        return 1
    else:
        print("❌ Not ready for Railway deployment - fix issues first")
        return 1

if __name__ == "__main__":
    sys.exit(main())
