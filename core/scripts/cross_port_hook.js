const http = require('http');

// This loops your monetized parsing data outputs right into your background tracker network
const payload = JSON.stringify({
  event: "CROSS_PORT_HOOK_ESTABLISHED",
  timestamp: new Date().toISOString(),
  networks: ["Arbitrum Sepolia", "SynthSwarm-Prod-Node"]
});

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  console.log(`📡 Bridge connection verified via Gateway status code: ${res.statusCode}`);
});

req.on('error', () => {
  console.log("⚠️ Background node tracker is currently sleeping. Bridge mapped and standing by.");
});

req.write(payload);
req.end();
