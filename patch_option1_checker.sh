#!/usr/bin/env bash
set -euo pipefail

sed -i '/manage_files() {/,/^}/c\
manage_files() {\
    clear\
    echo "🛡️  --- EXECUTING PRE-LAUNCH DEPENDENCY CHECK ---"\
    ./core/scripts/check_dependencies.sh\
    echo ""\
    echo "📁 --- AUTOMATED DESKTOP FILE SYNCHRONIZATION ---"\
    if [ -f core/scripts/sync_milestones.sh ]; then\
        ./core/scripts/sync_milestones.sh\
    else\
        echo "📝 Initializing sync utility script..."\
        cat << '\''EOS'\'' > core/scripts/sync_milestones.sh\
#!/usr/bin/env bash\
mkdir -p "$HOME/Desktop/Willstone_Nexus_Sync"\
if [ -f core/files/latest_entry.txt ]; then\
    cp core/files/latest_entry.txt "$HOME/Desktop/Willstone_Nexus_Sync/Milestone_$(date +%Y%m%d_%H%M%S).txt"\
    echo "✅ Success: Text inputs cloned directly to your Chromebook Desktop."\
else\
    echo "ℹ️ Desktop folder updated. Standing by for transaction log triggers."\
fi\
EOS\
        chmod +x core/scripts/sync_milestones.sh\
        ./core/scripts/sync_milestones.sh\
    fi\
    echo "=============================================================================="\
    echo "Active Files inside your Chromebook Desktop Sync Folder:"\
    ls -1 "$HOME/Desktop/Willstone_Nexus_Sync" 2>/dev/null || echo "Folder empty."\
    echo "=============================================================================="\
    read -p "Press [Enter] to return to the main console..."\
}' nexus_dashboard.sh

echo "⚡ Dashboard patched: Option 1 now runs the automated dependency check before sync."
