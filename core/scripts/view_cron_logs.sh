#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="core/files/cron_logs.txt"

clear
echo "📋 --- BACKGROUND AUTOMATION ACTIVITY MONITOR ---"
echo "=============================================================================="

if [ -f "$LOG_FILE" ]; then
    echo "📊 Total Automated Keep-Alive Scans: $(grep -c "System Status Diagnostic" "$LOG_FILE" || echo "0")"
    echo "------------------------------------------------------------------------------"
    echo "Last 3 Automated Verification Entries:"
    tail -n 15 "$LOG_FILE"
else
    echo "⏳ System notice: Awaiting initial background interval execution tick."
    echo "💡 Note: Cron triggers precisely at the start of every rolling minute."
fi
echo "=============================================================================="
read -p "Press [Enter] to return..."
