#!/usr/bin/env bash
# Sovereign Background Process Manager Wrapper - Absolute Path Edition
export PATH=/usr/local/bin:/usr/bin:/bin:/home/timothyhuff25/.local/bin

# Explicitly use absolute paths for the execution binary and target files
if pgrep -f "node /home/timothyhuff25/willstone-nexus/mempool-listener.js" > /dev/null; then
    echo "✅ Mempool listener is already running securely."
else
    echo "⚠️ Process dead or dropped during sleep mode. Re-igniting pipeline..." >> /home/timothyhuff25/willstone-nexus/cron-errors.log
    
    # Force creation of the file and push process cleanly to background
    touch /home/timothyhuff25/willstone-nexus/stream-output.log
    nohup /usr/bin/node /home/timothyhuff25/willstone-nexus/mempool-listener.js >> /home/timothyhuff25/willstone-nexus/stream-output.log 2>&1 &
fi
