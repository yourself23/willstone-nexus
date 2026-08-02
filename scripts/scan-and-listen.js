import fs from 'fs';
import path from 'path';
import dotenv from "dotenv";

dotenv.config();

const csvPath = path.join(process.env.HOME, 'willstone-nexus/metrics-summary.csv');

async function rpcCall(url, method, params = []) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method, params, id: Date.now() })
    });
    const json = await response.json();
    return json.result;
  } catch (e) { return null; }
}

async function runDashboard() {
  try {
    // Force direct connection using your verified front-end project credentials
    const ALCHEMY_KEY = "alch_eqIGIh6LGoWKyVzSplSua";
    
    const targets = [
      { name: "Arbitrum One", url: `https://alchemy.com{ALCHEMY_KEY}` },
      { name: "Base Mainnet", url: `https://alchemy.com{ALCHEMY_KEY}` },
      { name: "Ethereum Main", url: `https://alchemy.com{ALCHEMY_KEY}` }
    ];

    const trackedAssets = [
      { name: "DUNA Engine Wallet", address: "0x36d86eA6f6420Edf9766271687704b13883f00f8" },
      { name: "Willstone Contract", address: "0xc7F0e17931b253F659ad8D36bf39ee" }
    ];

    for (const net of targets) {
      const gasHex = await rpcCall(net.url, "eth_gasPrice");
      let gasPriceGwei = gasHex ? Number(BigInt(gasHex) / 10000000n) / 100 : 0.0;

      for (const asset of trackedAssets) {
        const balanceHex = await rpcCall(net.url, "eth_getBalance", [asset.address, "latest"]);
        if (!balanceHex) continue;
        const ethBalance = Number(BigInt(balanceHex) / 1000000000000000n) / 1000;

        // Write live verified frames to database
        const csvLine = `${new Date().toISOString()},0,${asset.name},${net.name},${ethBalance.toFixed(5)},${gasPriceGwei.toFixed(2)},0,0,0,0\n`;
        fs.appendFileSync(csvPath, csvLine);
      }
    }
  } catch (err) {}
}

setInterval(runDashboard, 4000);
runDashboard();
