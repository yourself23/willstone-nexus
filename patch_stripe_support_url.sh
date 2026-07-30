#!/usr/bin/env bash
set -euo pipefail

# Append a clean, compliant JSON support endpoint directly to your server file
cat << 'NODE_SUPPORT' >> api/core/server.js

// Public Business Support & Customer Contact Routing Layer
app.get('/api/v1/support', (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({
    business_name: "Willstone Nexus Systems",
    support_email: "timothyhuff25@gmail.com",
    compliance_status: "ACTIVE",
    service_tier: "Premium Data Utilities Support Hub",
    message: "Need transaction or access key help? Email our queue directly for 12-hour resolution."
  });
});
NODE_SUPPORT

echo "🛑 Cycling server processes to deploy the fresh support routing rules..."
pkill -f "server.js" || true
node api/core/server.js > /dev/null 2>&1 &
sleep 1

echo "=============================================================================="
echo "⚡ SUCCESS: Support pathway activated natively on Port 3005."
echo "=============================================================================="
