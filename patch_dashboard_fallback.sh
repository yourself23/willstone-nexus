#!/usr/bin/env bash
set -euo pipefail

# Re-write the text_entry function with automated fallback capabilities
sed -i '/text_entry() {/,/^}/c\
text_entry() {\
    clear\
    echo "📝 --- WILLSTONE NEXUS TRANSACTION VALIDATOR ---"\
    echo "Leave blank and press [Enter] to auto-select a random test hash."\
    echo "=============================================================================="\
    echo -n "Paste your Arbitrum Sepolia transaction hash (0x...): "\
    read -r tx_hash\
    \
    if [ -z "$tx_hash" ]; then\
        if [ -f core/files/test_hashes.txt ]; then\
            echo "🎲 No manual input detected. Selecting a random test transaction hash..."\
            tx_hash=$(grep -oE "0x[a-fA-F0-9]{64}" core/files/test_hashes.txt | shuf -n 1)\
            echo "📍 Selected Hash: $tx_hash"\
        else\
            echo "❌ Input is blank and core/files/test_hashes.txt was not found."\
            echo "=============================================================================="\
            read -p "Press [Enter] to return..."\
            return\
        fi\
    fi\
    \
    # Save a record for the desktop synchronization matrix\
    echo "Transaction Hash Logged: $tx_hash on $(date)" > core/files/latest_entry.txt\
    \
    if [ -f core/scripts/track_tx.js ]; then\
        node core/scripts/track_tx.js "$tx_hash"\
    else\
        echo "✅ Hash successfully recorded in core/files/latest_entry.txt."\
        echo "💡 Note: To run a live block lookup, verify that core/scripts/track_tx.js is present."\
    fi\
    echo "=============================================================================="\
    read -p "Press [Enter] to return..."\
}' nexus_dashboard.sh

echo "⚡ Dashboard patched successfully with smart transaction fallbacks."
