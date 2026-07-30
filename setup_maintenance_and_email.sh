#!/usr/bin/env bash
set -euo pipefail

mkdir -p core/scripts core/config

# 1. Write the dynamic Node SMTP email dispatcher code
cat << 'NODE_EMAIL' > core/scripts/send_alert.js
const nodemailer = require('nodemailer');
const fs = require('fs');

// Read production routing parameters
const config = JSON.parse(fs.readFileSync('./core/config/active_routing.json', 'utf8'));

// Standard configuration template. Replace with your actual verified email SMTP values
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net', 
  port: 587,
  auth: {
    user: 'apikey', 
    pass: 'YOUR_SENDGRID_OR_MAILGUN_API_KEY' 
  }
});

async function dispatchNotification(subject, body) {
  try {
    await transporter.sendMail({
      from: '"Willstone Nexus Shield" <alerts@willstonenexus.com>',
      to: 'timothyhuff25@gmail.com', // <-- Put your target recipient email here
      subject: `🚨 [NEXUS ALERTS]: ${subject}`,
      text: body
    });
    console.log("📨 Automated repair notification successfully dispatched via SMTP.");
  } catch (error) {
    console.error("❌ Email transmission failed:", error.message);
  }
}

const args = process.argv.slice(2);
if (args[0] && args[1]) {
  dispatchNotification(args[0], args[1]);
}
NODE_EMAIL

# 2. Write the automated weekly updater routine script
cat << 'WEEKLY_UPDATE' > core/scripts/weekly_updater.sh
#!/usr/bin/env bash
set -euo pipefail
echo "🧹 Commencing Automated Weekly Infrastructure Maintenance..." >> core/files/cron_logs.txt
sudo apt-get update -y && sudo apt-get upgrade -y --with-new-pkgs -y
npm update -g @alchemy/platform-cli || true
echo "✅ Weekly upgrade cycle successfully finalized on $(date)" >> core/files/cron_logs.txt
WEEKLY_UPDATE
chmod +x core/scripts/weekly_updater.sh

# 3. Schedule the components via Crontab (Weekly Maintenance: Sundays at 2:00 AM)
PROJECT_ROOT=$(pwd)
CURRENT_CRON=$(crontab -l 2>/dev/null || true)
UPDATE_JOB="0 2 * * 0 cd ${PROJECT_ROOT} && ./core/scripts/weekly_updater.sh >> ./core/files/cron_logs.txt 2>&1"

if echo "$CURRENT_CRON" | grep -F "weekly_updater.sh" > /dev/null; then
    echo "✅ Update schedule already injected."
else
    (echo "$CURRENT_CRON"; echo "$UPDATE_JOB") | crontab -
    echo "🚀 Scheduled weekly system upgrades to run automatically every Sunday at 02:00 AM."
fi
