#!/usr/bin/env bash
set -euo pipefail

# 1. Update Option 3 to act as an Automated Smart Contract Registry Looker
sed -i '/promo_registry() {/,/^}/c\
promo_registry() {\
    clear\
    echo "🎟️  --- AUTOMATED CONTRACT SYSTEM DATABASE ---"\
    if [ -f core/files/contract_addresses.txt ]; then\
        cat core/files/contract_addresses.txt\
        echo ""\
        echo -n "Select an Address to Auto-Inject into active testing payload [1-3]: "\
        read -r choice\
        case "$choice" in\
            1) target_addr=$(grep -oE "0x[a-fA-F0-9]{40}" core/files/contract_addresses.txt | sed -n "1p") ;;\
            2) target_addr=$(grep -oE "0x[a-fA-F0-9]{40}" core/files/contract_addresses.txt | sed -n "2p") ;;\
            3) target_addr=$(grep -oE "0x[a-fA-F0-9]{40}" core/files/contract_addresses.txt | sed -n "3p") ;;\
            *) echo "🎲 No input. Auto-selecting random production index..."; target_addr=$(grep -oE "0x[a-fA-F0-9]{40}" core/files/contract_addresses.txt | shuf -n 1) ;;\
        esac\
        echo "📍 Target Destination Captured: $target_addr"\
        echo "Selected Contract Address: $target_addr on $(date)" > core/files/latest_entry.txt\
        echo "✅ Address successfully logged inside core/files/latest_entry.txt for Desktop Sync."\
    else\
        echo "❌ Local Database file not found."\
    fi\
    echo "=============================================================================="\
    read -p "Press [Enter] to return..."\
}' nexus_dashboard.sh

# 2. Update Option 4 to execute the Automated Active Loop Check
sed -i '/start_node() {/,/^}/c\
start_node() {\
    clear\
    ./core/scripts/auto_monitor.sh\
    read -p "Press [Enter] to return to Dashboard..."\
}' nexus_dashboard.sh

echo "⚡ Dashboard infrastructure modified successfully with full network automation hooks."
