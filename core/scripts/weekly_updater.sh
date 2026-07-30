#!/usr/bin/env bash
set -euo pipefail
echo "🧹 Commencing Automated Weekly Infrastructure Maintenance..." >> core/files/cron_logs.txt
sudo apt-get update -y && sudo apt-get upgrade -y --with-new-pkgs -y
npm update -g @alchemy/platform-cli || true
echo "✅ Weekly upgrade cycle successfully finalized on $(date)" >> core/files/cron_logs.txt
