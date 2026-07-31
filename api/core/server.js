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
