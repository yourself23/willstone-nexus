#!/usr/bin/env bash
set -euo pipefail

cat << 'BOT_SWARM' > core/scripts/bot_advertiser.sh
#!/usr/bin/env bash
set -euo pipefail

API_ENDPOINT="http://localhost:3005/api/v1/parse-metadata"
STRIPE_LINK="https://stripe.com"

echo "🤖 Launching Commercial Ad-Bot Swarm Node Layer..."
echo "------------------------------------------------------------------------------"

# Automated message package payload construction
MESSAGE_BODY="✨ NEED HIGH-VELOCITY PARSING? Connect to the Willstone Nexus Microservice API! Fast, enterprise-grade metadata extraction secured by Arbitrum Sepolia. Initialize access keys instantly via our portal link: ${STRIPE_LINK}"

echo "📢 Advertising Payload Generated:"
echo "${MESSAGE_BODY}"
echo "------------------------------------------------------------------------------"

# Simulate broadcasting across open web tracking targets or social webhook nodes
echo "🛰️  Broadcasting payload to distributed developer channels..."
sleep 1
echo "✅ Broadcast successful. Marketing logs updated."
BOT_SWARM
chmod +x core/scripts/bot_advertiser.sh

# Bind marketing schedule to run automatically every 12 hours
PROJECT_ROOT=$(pwd)
CURRENT_CRON=$(crontab -l 2>/dev/null || true)
MARKETING_JOB="0 */12 * * * cd ${PROJECT_ROOT} && ./core/scripts/bot_advertiser.sh >> ./core/files/marketing_logs.txt 2>&1"

if echo "$CURRENT_CRON" | grep -F "bot_advertiser.sh" > /dev/null; then
    echo "✅ Advertising swarm schedule already active."
else
    (echo "$CURRENT_CRON"; echo "$MARKETING_JOB") | crontab -
    echo "🚀 Success: Ad-bot swarm scheduled to broadcast every 12 hours automatically."
fi
