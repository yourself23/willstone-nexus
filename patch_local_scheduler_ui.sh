#!/usr/bin/env bash
set -euo pipefail

sed -i '/start_node() {/,/^}/c\
start_node() {\
    clear\
    echo "📋 --- INDEPENDENT SCHEDULER ACTIVITY LOGS ---"\
    echo "=============================================================================="\
    if [ -f core/files/marketing_logs.txt ]; then\
        echo "📊 Total Automated Runs: $(grep -c "Interval Execution Triggered" core/files/marketing_logs.txt || echo "0")"\
        echo "------------------------------------------------------------------------------"\
        tail -n 15 core/files/marketing_logs.txt\
    else\
        echo "⏳ Initializing worker log output streams... Check back in a few moments."\
    fi\
    echo "=============================================================================="\
    read -p "Press [Enter] to return..."\
}' nexus_dashboard.sh

echo "⚡ Dashboard patched: Option 4 is now connected to your custom background daemon."
