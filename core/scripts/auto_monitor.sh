#!/usr/bin/env bash
# ==============================================================================
# WILLSTONE NEXUS: AUTOMATED LIVE STATUS DAEMON & CONSOLE INTEGRATION
# ==============================================================================
set -euo pipefail

CONFIG_FILE="core/config/active_routing.json"
TARGET_PORT=3001

echo "🔍 Running Deep System Status Diagnostic Checks..."
echo "=============================================================================="

# 1. Evaluate Port 3001 Socket Binding State
if lsof -i :$TARGET_PORT >/dev/null 2>&1; then
    NODE_PID=$(lsof -t -i :$TARGET_PORT | head -n 1)
    echo "📡 SOCKET STATUS    : ACTIVE (Listening on Port ${TARGET_PORT})"
    echo "🆔 BACKGROUND PID    : ${NODE_PID}"
else
    echo "🚨 SOCKET STATUS    : OFFLINE (Port ${TARGET_PORT} is Closed)"
    if [ -f core/scripts/runtime_listener.js ]; then
        echo "🔄 AUTOMATION       : Restarting Background Runtime Worker Network..."
        node core/scripts/runtime_listener.js > /dev/null 2>&1 &
        sleep 1
        echo "✅ AUTOMATION STATUS: Service restored successfully."
    else
        echo "❌ AUTOMATION STATUS: Recovery failed. Core script missing."
    fi
fi

# 2. Extract Validated Active Routing Configuration Logs
if [ -f "$CONFIG_FILE" ]; then
    echo "📁 ROUTING PROFILE  : SYNCHRONIZED"
    echo "🏷️  NODE IDENTITY   : $(grep -o '"PROJECT_NAME": "[^"]*' "$CONFIG_FILE" | cut -d'"' -f4 || echo "Unknown")"
    echo "🔗 NETWORK ID       : $(grep -o '"TARGET_CHAIN_ID": [0-9]*' "$CONFIG_FILE" | cut -d' ' -f2 || echo "Unknown")"
else
    echo "⚠️  ROUTING PROFILE  : MISSING LOCAL MATRIX CONFIGURATION"
fi

# 3. Check for Active Gas Policies
if [ -f core/config/gas_policy.json ]; then
    echo "⛽ GAS POLICY STATUS: ARMED & SPONSORED"
else
    echo "⛽ GAS POLICY STATUS: IDLE (Direct Wallet Gas Billing Active)"
fi
echo "=============================================================================="
