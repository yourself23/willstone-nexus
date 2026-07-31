#!/usr/bin/env bash
# Sovereign Background Process Manager Wrapper - Artifact Tracking Edition
export PATH=/usr/local/bin:/usr/bin:/bin:/home/timothyhuff25/.local/bin

LOG_FILE="/home/timothyhuff25/willstone-nexus/stream-output.log"
CRON_LOG="/home/timothyhuff25/willstone-nexus/cron-errors.log"
BUILD_DIR="/home/timothyhuff25/willstone-nexus/build"

# 1. Automated Log Truncation
if [ -f "$LOG_FILE" ]; then
    FILE_SIZE=$(du -m "$LOG_FILE" | cut -f1)
    if [ "$FILE_SIZE" -gt 50 ]; then
        echo "" > "$LOG_FILE"
    fi
fi

# 2. Build Directory Telemetry: Track compiled artifact storage footprints
if [ -d "$BUILD_DIR" ]; then
    BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
    echo "📊 [TELEMETRY] Current Build Directory Artifact Footprint: $BUILD_SIZE" >> "$CRON_LOG"
fi

# 3. Process Guardian
if pgrep -f "node /home/timothyhuff25/willstone-nexus/mempool-listener.js" > /dev/null; then
    echo "✅ Mempool listener is already running securely."
else
    echo "⚠️ Process dead or dropped during sleep mode. Re-igniting pipeline..." >> "$CRON_LOG"
    touch "$LOG_FILE"
    nohup /usr/local/bin/node /home/timothyhuff25/willstone-nexus/mempool-listener.js >> "$LOG_FILE" 2>&1 &
fi
