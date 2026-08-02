#!/bin/bash
# --- WILLSTONE NEXUS AUTOMATED LOG MANIPULATION UTILITY ---
LOG_FILE="$HOME/willstone-nexus/bridge-service.log"
MAX_SIZE_BYTES=5242880 # Strict 5MB operational threshold limit

if [ -f "$LOG_FILE" ]; then
    FILE_SIZE=$(stat -c%s "$LOG_FILE")
    if [ "$FILE_SIZE" -gt "$MAX_SIZE_BYTES" ]; then
        # Perform zero-allocation file clearing to instantly reclaim block space without breaking descriptors
        > "$LOG_FILE"
        echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] STORAGE_OPTIMIZATION | File footprint threshold crossed. Log truncated safely." >> "$LOG_FILE"
    fi
fi
