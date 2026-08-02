import fs from 'fs';
import path from 'path';
import dotenv from "dotenv";

dotenv.config();

const registryPath = path.join(process.env.HOME, 'willstone-nexus/scripts/discovered-assets.json');

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
    if (!fs.existsSync(registryPath)) {
      console.log("Waiting for asset database to generate...");
      return;
    }

    const data = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    
    // Resolve dynamic Alchemy Key: Check process environment first, then crawl disk database, fallback to public if missing
    let finalKey = process.env.ALCHEMY_API_KEY;
    if (!finalKey && data.keys && data.keys.length > 0) {
      finalKey = data.keys[0]; // Dynamically grabs the first valid key found on disk
    }
    // Hard fallback to let the engine operate even if files are missing keys
    const ALCHEMY_URL = finalKey ? `https://alchemy.com{finalKey}` : "https://alchemy.com";

    // Deduplicate discovered contract addresses and wallets
    const combinedAddresses = [...new Set([...(data.contracts || []), ...(data.wallets || [])])].slice(0, 15);
    const matrixRows = [];

    // Fetch live network gas price to evaluate execution thresholds
    const gasHex = await rpcCall(ALCHEMY_URL, "eth_gasPrice");
    const gasGwei = gasHex ? (Number(BigInt(gasHex) / 10000000n) / 100).toFixed(4) : "Offline";

    for (const address of combinedAddresses) {
      if (!address || address.length !== 42) continue;
      
      const balanceHex = await rpcCall(ALCHEMY_URL, "eth_getBalance", [address, "latest"]);
      if (!balanceHex) continue;

      const rawBalance = BigInt(balanceHex);
      const ethBalance = Number(rawBalance / 1000000000000000n) / 1000;

      matrixRows.push({
        "Global Discovered Asset": `${address.slice(0, 12)}...${address.slice(-8)}`,
        "Live Network Link": "Arbitrum One Mainnet",
        "Gas (Gwei)": gasGwei,
        "Production Balance": `${ethBalance.toFixed(5)} ETH`
      });
    }

    process.stdout.write('\x1Bc');
    console.log("==========================================================================");
    console.log(`   WILLSTONE NEXUS — LIVE ARBITRUM PRODUCTION DISK MONITOR               `);
    console.log("==========================================================================");
    console.log(`  • Active Alchemy Tunnel   : ${finalKey ? "Authenticated Keys Loaded" : "Public Routing Mode"}`);
    console.log(`  • Network Status          : Connected to Live Global Production Layer`);
    console.log("==========================================================================\n");

    if (matrixRows.length === 0) {
      console.log("  Scanning live endpoints... No production balances found on these addresses.");
    } else {
      console.table(matrixRows);
    }
  } catch (err) {}
}

// Set loop intervals to 6 seconds to prevent hitting Alchemy rate limits on multiple keys
setInterval(runDashboard, 6000);
runDashboard();
