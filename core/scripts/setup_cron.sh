#!/usr/bin/env bash
# ==============================================================================
# WILLSTONE NEXUS: CRON AUTOMATION INJECTOR & ENVIRONMENT SETUP
# ==============================================================================
set -euo pipefail

PROJECT_ROOT=$(pwd)
CRON_JOB="* * * * * cd ${PROJECT_ROOT} && ./core/scripts/auto_monitor.sh >> ./core/files/cron_logs.txt 2>&1"

echo "⏳ Configuring background scheduler utilities..."
echo "=============================================================================="

# 1. Enforce installation of system cron managers if missing inside Linux penguin
if ! command -v crontab &> /dev/null; then
    echo "📦 Package manager alert: Installing missing system scheduler suite..."
    sudo apt-get update -qq && sudo apt-get install -y -qq cron
    sudo service cron start || sudo systemctl start cron
fi

# 2. Extract active cron profile mappings safely
CURRENT_CRON=$(crontab -l 2>/dev/null || true)

# 3. Inject task loop rules only if they are not already active
if echo "$CURRENT_CRON" | grep -F "auto_monitor.sh" > /dev/null; then
    echo "✅ MONITOR CHECK: Background 60-second crontab automation loop is already active."
else
    (echo "$CURRENT_CRON"; echo "$CRON_JOB") | crontab -
    echo "🚀 SCHEDULE ACTIVE: Automated monitoring script bound to 1-minute execution ticks."
fi

echo "=============================================================================="
