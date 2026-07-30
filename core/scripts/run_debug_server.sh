#!/usr/bin/env bash
# ==============================================================================
# WILLSTONE NEXUS: FOREGROUND PROCESS SUPERVISOR & ERROR LOG CAPTURE
# ==============================================================================
set -euo pipefail

echo "🧹 Sanitizing microservice workspace environment layout..."
mkdir -p api/core core/config core/files

# Re-enforce clean, functional API code blocks
cat << 'NODE_FIX' > api/core/server.js
const express = require('express');
const app = express();
const PORT = 3005;

app.use(express.json());

const ALLOWED_ORIGIN = "https://untangle-collective.emergent.host";

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

app.get('/api/v1/node-stats', (req, res) => {
  res.json({
    status: "ONLINE",
    nodeName: "SynthSwarm-Prod-Node",
    activePort: PORT,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => console.log(`✨ Engine is listening cleanly on port ${PORT}`));
NODE_FIX

echo "🛑 Cleaning up any stale port processes..."
pkill -f "server.js" || true

echo "🚀 Starting Node API engine in validation logging mode..."
echo "=============================================================================="
node api/core/server.js
