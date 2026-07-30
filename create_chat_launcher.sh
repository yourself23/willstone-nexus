#!/usr/bin/env bash
set -euo pipefail

# 1. Establish standard local application directory pathways
mkdir -p ~/.local/share/applications

# 2. Compile the custom Chrome OS system launcher configuration
cat << 'APP' > ~/.local/share/applications/willstone-chat-nexus.desktop
[Desktop Entry]
Version=1.0
Type=Application
Name=Willstone Nexus Chat Launcher
Comment=Instantly resume active development workspace conversation
Exec=xdg-open "https://google.com"
Icon=utilities-terminal
Terminal=false
Categories=Development;
APP

# 3. Update the Chromebook system application databases
update-desktop-database ~/.local/share/applications/ 2>/dev/null || true

echo "=============================================================================="
echo "✨ SUCCESS: Launcher successfully registered to your Chromebook Search!"
echo "=============================================================================="
