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
    read -r tx_hash
    
    if [ -z "$tx_hash" ]; then
        if [ -f core/files/test_hashes.txt ]; then
            echo "🎲 No manual input detected. Selecting a random test transaction hash..."
            tx_hash=$(grep -oE "0x[a-fA-F0-9]{64}" core/files/test_hashes.txt | shuf -n 1)
            echo "📍 Selected Hash: $tx_hash"
        else
            echo "❌ Input is blank and core/files/test_hashes.txt was not found."
            echo "=============================================================================="
            read -p "Press [Enter] to return..."
            return
        fi
    fi
    
    # Save a record for the desktop synchronization matrix
    echo "Transaction Hash Logged: $tx_hash on $(date)" > core/files/latest_entry.txt
    
    if [ -f core/scripts/track_tx.js ]; then
        node core/scripts/track_tx.js "$tx_hash"
    else
        echo "✅ Hash successfully recorded in core/files/latest_entry.txt."
        echo "💡 Note: To run a live block lookup, verify that core/scripts/track_tx.js is present."
    fi
    echo "=============================================================================="
    read -p "Press [Enter] to return..."
}

promo_registry() {
    clear
    echo "🎟️  --- AUTOMATED CONTRACT SYSTEM DATABASE ---"
    if [ -f core/files/contract_addresses.txt ]; then
        cat core/files/contract_addresses.txt
        echo ""
        echo -n "Select an Address to Auto-Inject into active testing payload [1-3]: "
        read -r choice
        case "$choice" in
            1) target_addr=$(grep -oE "0x[a-fA-F0-9]{40}" core/files/contract_addresses.txt | sed -n "1p") ;;
            2) target_addr=$(grep -oE "0x[a-fA-F0-9]{40}" core/files/contract_addresses.txt | sed -n "2p") ;;
            3) target_addr=$(grep -oE "0x[a-fA-F0-9]{40}" core/files/contract_addresses.txt | sed -n "3p") ;;
            *) echo "🎲 No input. Auto-selecting random production index..."; target_addr=$(grep -oE "0x[a-fA-F0-9]{40}" core/files/contract_addresses.txt | shuf -n 1) ;;
        esac
        echo "📍 Target Destination Captured: $target_addr"
        echo "Selected Contract Address: $target_addr on $(date)" > core/files/latest_entry.txt
        echo "✅ Address successfully logged inside core/files/latest_entry.txt for Desktop Sync."
    else
        echo "❌ Local Database file not found."
    fi
    echo "=============================================================================="
    read -p "Press [Enter] to return..."
}

start_node() {
    clear
    echo "📋 --- INDEPENDENT SCHEDULER ACTIVITY LOGS ---"
    echo "=============================================================================="
    if [ -f core/files/marketing_logs.txt ]; then
        echo "📊 Total Automated Runs: $(grep -c "Interval Execution Triggered" core/files/marketing_logs.txt || echo "0")"
        echo "------------------------------------------------------------------------------"
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
