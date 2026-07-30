#!/usr/bin/env bash
set -euo pipefail

# Build required folder slots
mkdir -p core/config core/promos core/files core/scripts api/core

show_menu() {
    clear
    echo "=============================================================================="
    echo "⚡ WILLSTONE NEXUS: ENTERPRISE COMMAND & CONTROL DASHBOARD ⚡"
    echo "=============================================================================="
    echo "1) 📁 View & Execute Desktop File Sync"
    echo "2) 📝 Track Arbitrum Sepolia Transactions (JSON-RPC)"
    echo "3) 💵 View USD Prepaid Card Sales Ledger"
    echo "4) 📋 Independent Scheduler Activity Logs"
    echo "5) ❌ Stop Systems & Exit Dashboard"
    echo "=============================================================================="
    echo -n "Please select an entry option [1-5]: "
}

manage_files() {
    clear
    echo "🛡️  --- EXECUTING PRE-LAUNCH DEPENDENCY CHECK ---"
    ./core/scripts/check_dependencies.sh
    echo ""
    echo "📁 --- AUTOMATED DESKTOP FILE SYNCHRONIZATION ---"
    if [ -f core/scripts/sync_milestones.sh ]; then
        ./core/scripts/sync_milestones.sh
    else
        echo "📝 Initializing sync utility script..."
        cat << 'EOS' > core/scripts/sync_milestones.sh
#!/usr/bin/env bash
mkdir -p "$HOME/Desktop/Willstone_Nexus_Sync"
if [ -f core/files/latest_entry.txt ]; then
    cp core/files/latest_entry.txt "$HOME/Desktop/Willstone_Nexus_Sync/Milestone_$(date +%Y%m%d_%H%M%S).txt"
    echo "✅ Success: Text inputs cloned directly to your Chromebook Desktop."
else
    echo "ℹ️ Desktop folder updated. Standing by for transaction log triggers."
fi
EOS
        chmod +x core/scripts/sync_milestones.sh
        ./core/scripts/sync_milestones.sh
    fi
    echo "=============================================================================="
    echo "Active Files inside your Chromebook Desktop Sync Folder:"
    ls -1 "$HOME/Desktop/Willstone_Nexus_Sync" 2>/dev/null || echo "Folder empty."
    echo "=============================================================================="
    read -p "Press [Enter] to return to the main console..."
}

text_entry() {
    clear
    echo "📝 --- WILLSTONE NEXUS TRANSACTION VALIDATOR ---"
    echo "Leave blank and press [Enter] to auto-select a random test hash."
    echo "=============================================================================="
    echo -n "Paste your Arbitrum Sepolia transaction hash (0x...): "
    read -r tx_hash || true
    
    if [ -z "$tx_hash" ]; then
        if [ -f core/files/test_hashes.txt ]; then
            echo "🎲 Selecting a random test transaction hash..."
            tx_hash=$(grep -oE "0x[a-fA-F0-9]{64}" core/files/test_hashes.txt | shuf -n 1 || echo "")
            if [ -z "$tx_hash" ]; then
                tx_hash="0x12a9b343867cdb215830eb198fdb523c9ff4ef210c49735d46e3be538413b11c"
            fi
            echo "📍 Selected Hash: $tx_hash"
        else
            tx_hash="0x12a9b343867cdb215830eb198fdb523c9ff4ef210c49735d46e3be538413b11c"
            echo "📍 Fallback Hash Set: $tx_hash"
        fi
    fi
    
    echo "Transaction Hash Logged: $tx_hash on $(date)" > core/files/latest_entry.txt
    
    if [ -f core/scripts/track_tx.js ]; then
        node core/scripts/track_tx.js "$tx_hash" || true
    else
        echo "✅ Hash successfully recorded inside core/files/latest_entry.txt."
    fi
    echo "=============================================================================="
    read -p "Press [Enter] to return..."
}

promo_registry() {
    clear
    echo "💵 --- REAL-TIME USD PREPAID CARD LEDGER MONITOR ---"
    echo "=============================================================================="
    if [ -f core/files/usd_sales_ledger.txt ]; then
        cat core/files/usd_sales_ledger.txt
    else
        echo "⏳ Awaiting direct third-party cash checkout hook entry."
        echo "💡 Ready to load connected cards on incoming customer webhook events."
    fi
    echo "=============================================================================="
    read -p "Press [Enter] to return..."
}

start_node() {
    clear
    echo "📋 --- INDEPENDENT SCHEDULER ACTIVITY LOGS ---"
    echo "=============================================================================="
    if [ -f core/files/marketing_logs.txt ]; then
        tail -n 15 core/files/marketing_logs.txt
    else
        echo "⏳ Initializing worker log output streams... Check back in a few moments."
    fi
    echo "=============================================================================="
    read -p "Press [Enter] to return..."
}

# Main Application Execution Loop
while true; do
    show_menu
    if ! read -r choice; then
        echo "Exiting..."
        exit 0
    fi
    case "$choice" in
        1) manage_files ;;
        2) text_entry ;;
        3) promo_registry ;;
        4) start_node ;;
        5) 
            clear
            echo "🧹 Stopping Willstone Nexus Background Systems..."
            pkill -f "nexus_scheduler.sh" || true
            pkill -f "usd_paywall.js" || true
            echo "👋 All background tasks paused safely. Exiting control console."
            exit 0 
            ;;
        *) echo "❌ Invalid selection." && sleep 1 ;;
    esac
done
