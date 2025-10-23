#!/usr/bin/env python3
"""
Render Configuration Test
Tests Render deployment configuration
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

def test_yaml_syntax(file_path, description):
    """Test YAML file syntax"""
    try:
        # Try to parse as YAML using basic Python
        with open(file_path) as f:
            content = f.read()
            
        # Basic YAML validation - check for common issues
        if 'services:' not in content:
            print(f"❌ FAIL {description}: Missing 'services:' key")
            return False
            
        if 'type: web' not in content:
            print(f"❌ FAIL {description}: Missing 'type: web'")
            return False
            
        if 'env: node' not in content:
            print(f"❌ FAIL {description}: Missing 'env: node'")
            return False
            
        print(f"✅ PASS {description}: {file_path}")
        return True
        
    except Exception as e:
        print(f"❌ FAIL {description}: {file_path} - {e}")
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

def test_render_yaml():
    """Test render.yaml configuration"""
    try:
        with open("render.yaml") as f:
            content = f.read()
        
        # Check required fields
        required_fields = ["services:", "type: web", "env: node", "buildCommand:", "startCommand:"]
        missing_fields = [field for field in required_fields if field not in content]
        
        if missing_fields:
            print(f"❌ FAIL render.yaml: Missing fields {missing_fields}")
            return False
        
        # Check build and start commands
        if "cd server && npm install" not in content:
            print("❌ FAIL render.yaml: Build command not found")
            return False
            
        if "cd server && npm start" not in content:
            print("❌ FAIL render.yaml: Start command not found")
            return False
        
        # Check environment variables
        if "envVars:" not in content:
            print("❌ FAIL render.yaml: Environment variables not configured")
            return False
        
        print("✅ PASS render.yaml: Configuration valid")
        return True
        
    except Exception as e:
        print(f"❌ FAIL render.yaml: {e}")
        return False

def test_server_package():
    """Test server package.json exists and has required scripts"""
    try:
        with open("server/package.json") as f:
            data = json.load(f)
        
        # Check required scripts
        required_scripts = ["start"]
        missing_scripts = [script for script in required_scripts if script not in data.get("scripts", {})]
        
        if missing_scripts:
            print(f"❌ FAIL server/package.json: Missing scripts {missing_scripts}")
            return False
        
        print("✅ PASS server/package.json: Required scripts present")
        return True
        
    except Exception as e:
        print(f"❌ FAIL server/package.json: {e}")
        return False

def test_environment_variables():
    """Test environment variables are documented"""
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
    
    print("✅ PASS Environment: All required variables present")
    return True

def test_deployment_script():
    """Test deployment script"""
    script_path = Path("deploy_render.sh")
    if not script_path.exists():
        print("❌ FAIL Deployment script: deploy_render.sh not found")
        return False
    
    # Check if script is executable
    if not os.access(script_path, os.X_OK):
        print("❌ FAIL Deployment script: Not executable")
        return False
    
    # Check script content
    with open(script_path) as f:
        content = f.read()
    
    required_commands = ["git push", "render.com"]
    missing_commands = [cmd for cmd in required_commands if cmd not in content]
    
    if missing_commands:
        print(f"❌ FAIL Deployment script: Missing commands {missing_commands}")
        return False
    
    print("✅ PASS Deployment script: Valid and executable")
    return True

def main():
    """Run all Render configuration tests"""
    print("🚀 Render Configuration Test")
    print("=" * 50)
    
    results = []
    
    # Test 1: Required files
    print("\n📁 Testing Required Files")
    results.append(test_file_exists("package.json", "Root package.json"))
    results.append(test_file_exists("render.yaml", "Render configuration"))
    results.append(test_file_exists("deploy_render.sh", "Deployment script"))
    results.append(test_file_exists("server/package.json", "Server package.json"))
    results.append(test_file_exists(".env", "Environment file"))
    
    # Test 2: YAML syntax
    print("\n🔍 Testing YAML Syntax")
    results.append(test_yaml_syntax("render.yaml", "render.yaml syntax"))
    
    # Test 3: Configuration validation
    print("\n⚙️  Testing Configuration")
    results.append(test_package_json())
    results.append(test_render_yaml())
    results.append(test_server_package())
    results.append(test_environment_variables())
    
    # Test 4: Deployment script
    print("\n📜 Testing Deployment Script")
    results.append(test_deployment_script())
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 Render Configuration Test Summary")
    print("=" * 50)
    
    passed = sum(results)
    total = len(results)
    success_rate = (passed / total) * 100 if total > 0 else 0
    
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {total - passed}")
    print(f"📊 Total: {total}")
    print(f"🎯 Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 90:
        print("🎉 Render configuration is ready for deployment!")
        return 0
    elif success_rate >= 70:
        print("⚠️  Mostly ready, but some issues need attention")
        return 1
    else:
        print("❌ Not ready for Render deployment - fix issues first")
        return 1

if __name__ == "__main__":
    sys.exit(main())
