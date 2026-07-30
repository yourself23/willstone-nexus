#!/usr/bin/env bash
# ==============================================================================
# WILLSTONE NEXUS: LOCAL BACKGROUND SCHEDULER DAEMON
# Bypasses systemd/cron entirely using an independent loop runner.
# ==============================================================================
set -euo pipefail

# Define execution interval metrics (12 hours in seconds = 43200)
INTERVAL=43200
LOG_FILE="core/files/marketing_logs.txt"

mkdir -p core/scripts core/files

echo "🤖 Willstone Local Background Daemon successfully initialized."
echo "⌛ Monitoring loop started on $(date)" >> "$LOG_FILE"

while true; do
    echo "==============================================================================" >> "$LOG_FILE"
    echo "⏱️ Interval Execution Triggered: $(date)" >> "$LOG_FILE"
    
    # Check for and execute the marketing ad-bot script safely
    if [ -f "core/scripts/bot_advertiser.sh" ]; then
        ./core/scripts/bot_advertiser.sh >> "$LOG_FILE" 2>&1
    else
        echo "⚠️ Warning: core/scripts/bot_advertiser.sh not found. Skipping task." >> "$LOG_FILE"
    fi
    
    echo "💤 Task loop complete. Sleeping for 12 hours..." >> "$LOG_FILE"
    
    # Enter low-overhead system sleep state until next interval
    sleep "$INTERVAL"
done
