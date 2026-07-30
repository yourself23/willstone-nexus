#!/usr/bin/env bash
set -euo pipefail

sed -i '/5) echo "👋 Closing Nexus Terminal Dashboard. Standing by."; exit 0 ;;/,/esac/c\
        5) \
            clear\
            echo "🧹 Stopping Willstone Nexus Background Systems..."\
            if pgrep -f "nexus_scheduler.sh" > /dev/null; then\
                echo "🛑 Terminating background scheduler daemon..."\
                kill $(pgrep -f "nexus_scheduler.sh")\
            fi\
            if pgrep -f "usd_paywall.js" > /dev/null; then\
                echo "🛑 Terminating local paywall listener..."\
                kill $(pgrep -f "usd_paywall.js")\
            fi\
            echo "👋 All background tasks paused safely. Exiting control console."; exit 0 ;;\
        *) echo "❌ Invalid selection. Please choose an option from 1 to 5." && sleep 1.5 ;;' nexus_dashboard.sh

echo "⚡ Kill-switch successfully wired directly into Option 5."
