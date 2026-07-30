#!/usr/bin/env bash
# ==============================================================================
# WILLSTONE NEXUS: AUTOMATED NODE DEPENDENCY AUDIT ENGINE
# ==============================================================================
set -euo pipefail

echo "🔍 Commencing Core Dependency Audit..."
echo "=============================================================================="

MISSING_COUNT=0

# 1. Verify Core Project Directory Matrix
echo -n "📁 Directory Structure Validation... "
if [ -d "api/core" ] && [ -d "core/scripts" ] && [ -d "core/files" ] && [ -d "core/config" ]; then
    echo "🟢 PASS"
else
    echo "🔴 FAIL"
    echo "   ⚙️ Rectifying layout..."
    mkdir -p api/core core/scripts core/files core/config
fi

# 2. Check and Enforce Mandatory Node.js Packages
check_npm_pkg() {
    local pkg_name=$1
    echo -n "📦 Package Verification (${pkg_name})... "
    if node -e "require('${pkg_name}')" >/dev/null 2>&1; then
        echo "🟢 INSTALLED"
    else
        echo "🔴 MISSING"
        echo "   📥 Installing ${pkg_name} now..."
        npm install --quiet "${pkg_name}"
    fi
}

check_npm_pkg "express"
check_npm_pkg "cors"
check_npm_pkg "ws"

# 3. Verify Vital Static Reference Maps
echo -n "📋 Test Database Verification... "
if [ -f "core/files/test_hashes.txt" ]; then
    echo "🟢 FOUND"
else
    echo "⚠️  MISSING (Generating local matrix fallback assets...)"
    cat << 'TXT' > core/files/test_hashes.txt
0x12a9b343867cdb215830eb198fdb523c9ff4ef210c49735d46e3be538413b11c
0x7b6c53d0e2e50cf16db2c2197f485dbbc38c9284488390b12b5b4e3cd96c8e31
0x44c32b5ee068dc44fbc7514a67bbadbc8923a1a9a836d50ff227eb0b1de5540e
0x89e13b827df61a8dc4e8bb24d57ee5b19e2bb398725f18ccebb2586e3fcdb20a
TXT
fi

echo "=============================================================================="
echo "✅ AUDIT COMPLETE: Environment properties initialized and validated."
