#!/usr/bin/env bash
set -euo pipefail
DESKTOP_PATH="$HOME/Desktop/Willstone_Nexus_Sync"
mkdir -p "$DESKTOP_PATH"

echo "⏳ Scanning local buffers for un-synced entries..."
if [ -f core/files/latest_entry.txt ]; then
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    cp core/files/latest_entry.txt "${DESKTOP_PATH}/Milestone_${TIMESTAMP}.txt"
    echo "✅ Success: Text inputs cloned directly to your Chromebook Desktop."
else
    echo "ℹ️ No recent manual entry found to log."
fi
