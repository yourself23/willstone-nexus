#!/usr/bin/env bash
set -euo pipefail

sed -i '/start_node() {/,/^}/c\
start_node() {\
    ./core/scripts/view_cron_logs.sh\
}' nexus_dashboard.sh

echo "⚡ Dashboard patched: Option 4 now tracks live background background automated events."
