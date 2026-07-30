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
