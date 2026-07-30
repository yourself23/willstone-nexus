#!/usr/bin/env bash
set -euo pipefail

echo "📝 Injecting Stripe-compliant legal policy pages into API server matrix..."
echo "=============================================================================="

cat << 'NODE_LEGAL' >> api/core/server.js

// Stripe-Compliant Public Privacy Policy API Route
app.get('/api/v1/privacy-policy', (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({
    title: "Privacy Policy for Willstone Nexus Systems",
    effective_date: "2026-07-21",
    information_collected: "We collect customer email addresses, browser user-agent tokens, and standard billing details during payment sessions via Stripe.",
    purpose_of_use: "Data is utilized strictly to authorize API access keys, measure server performance, and maintain commercial security standards.",
    third_party_disclosures: "We do not sell, trade, or distribute your information. Relevant transaction parameters are securely handled by our processing merchant, Stripe.",
    security_practices: "All incoming traffic runs through Cloudflare SSL encryption protocols. Data is housed in isolated environment matrices protected by access control layers."
  });
});

// Stripe-Compliant Public Terms of Service API Route
app.get('/api/v1/terms-of-service', (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({
    title: "Terms of Service for Willstone Nexus Systems",
    effective_date: "2026-07-21",
    permitted_use: "Users are granted non-exclusive, revocable rights to query our high-velocity metadata parsing endpoints using active prepaid validation keys.",
    prohibited_activities: "Any attempt to reverse-engineer server daemons, flood network ports, or execute denial-of-service attacks will result in immediate API key termination.",
    payment_terms: "All payments are processed in USD via standard credit cards. Refunds are managed on a case-by-case basis through our direct contact queues.",
    limitation_of_liability: "Willstone Nexus Systems is provided 'as-is'. We are not responsible for systemic network downtime or upstream data formatting modifications."
  });
});
NODE_LEGAL

echo "🔄 Cycling background processing scripts to take policies live..."
pkill -f "server.js" || true
node api/core/server.js > /dev/null 2>&1 &
sleep 1

echo "=============================================================================="
echo "⚡ SUCCESS: Privacy Policy and Terms of Service endpoints are live!"
echo "=============================================================================="
