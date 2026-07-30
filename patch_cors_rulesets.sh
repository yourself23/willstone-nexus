#!/usr/bin/env bash
set -euo pipefail

mkdir -p core/scripts

echo "🔒 Re-configuring network cross-origin access boundaries..."
echo "=============================================================================="

# 1. Patch the Port 3005 Commercial Parsing API
cat << 'NODE_3005' > api/core/server.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.json());

// Strict Explicit CORS Rule Specification Matrix
const ALLOWED_ORIGIN = "https://untangle-collective.emergent.host";

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle browser validation checks (Preflight OPTIONS) instantly
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Premium Statistics Pull Endpoints for your Front-End UI Dashboard
app.get('/api/v1/node-stats', (req, res) => {
  res.json({
    status: "ONLINE",
    nodeName: "SynthSwarm-Prod-Node",
    activePort: PORT,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/v1/parse-metadata', (req, res) => {
  const { rawHtml } = req.body;
  if (!rawHtml) return res.status(400).json({ error: "Missing source html" });
  res.json({ status: "SUCCESS", characterCount: rawHtml.length });
});

app.listen(PORT, () => console.log(`✨ Port 3005 Live with Safe CORS Maps for ${ALLOWED_ORIGIN}`));
NODE_3005


# 2. Patch the Port 3010 USD Payment Gateway Listener
cat << 'NODE_3010' > core/scripts/usd_paywall.js
const express = require('express');
const app = express();
const PORT = 3010;

app.use(express.json());

const ALLOWED_ORIGIN = "https://untangle-collective.emergent.host";

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

app.get('/api/v1/payment-stats', (req, res) => {
  res.json({
    gatewayStatus: "ARMED",
    paymentMode: "Fiat USD Prepaid Card Links",
    activePort: PORT,
    uptime: process.uptime().toFixed(0) + "s"
  });
});

app.listen(PORT, () => console.log(`🚀 Port 3010 Live with Safe CORS Maps for ${ALLOWED_ORIGIN}`));
NODE_3010

echo "🔄 Restarting background service listeners to apply new network maps..."
pkill -f "server.js" || true
pkill -f "usd_paywall.js" || true

node api/core/server.js > /dev/null 2>&1 &
node core/scripts/usd_paywall.js > /dev/null 2>&1 &
sleep 1

echo "=============================================================================="
echo "⚡ SUCCESS: CORS boundaries successfully secured. Front-end access granted!"
echo "=============================================================================="
