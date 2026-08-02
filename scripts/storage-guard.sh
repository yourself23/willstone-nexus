#!/bin/bash
# --- WILLSTONE NEXUS STORAGE GUARD DEAMON ---
LOG_FILE="$HOME/willstone-nexus/cleanup-audit.log"
AVAILABLE_KB=$(df / | awk 'NR==2 {print $4}')
THRESHOLD_KB=512000 # Strict 500MB storage threshold limit

if [ "$AVAILABLE_KB" -lt "$THRESHOLD_KB" ]; then
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] STORAGE_ALERT | Capacity fell below 500MB. Running forced optimization sweep..." >> "$LOG_FILE"
    # Execute midnight-cleanup internally to purge caches and truncate logs instantly
    /bin/bash "$HOME/willstone-nexus/scripts/midnight-cleanup.sh"
fi
