#!/usr/bin/env bash
# ==============================================================================
# WILLSTONE NEXUS: ENVIRONMENT PURGE & ARMED REBUILD LOGIC
# ==============================================================================
set -euo pipefail

echo "🧹 Commencing full local Node environment purge..."
echo "=============================================================================="

# 1. Terminate running background node execution scripts safely
echo "🛑 Halting active runtime server threads..."
pkill -f "server.js" || true
pkill -f "usd_paywall.js" || true

# 2. Obliterate corrupted caching folders and package trees
echo "🗑️  Purging node_modules, lockfiles, and local tracking caches..."
rm -rf node_modules package-lock.json api/node_modules api/package-lock.json

# 3. Execute violent npm cache override wipe
echo "🧼 Executing forced global npm registry cache verification..."
npm cache clean --force

# 4. Re-verify project file metadata layout structures
echo "📁 Restoring workspace matrix configuration directories..."
mkdir -p api/core core/config core/files core/scripts

# 5. Kick off high-velocity package download stream from clean layers
echo "📥 Running fresh deployment installs for core systems..."
npm install --quiet

echo "=============================================================================="
echo "✨ SUCCESS: Environment successfully stabilized. System cache is 100% clean."
echo "=============================================================================="
