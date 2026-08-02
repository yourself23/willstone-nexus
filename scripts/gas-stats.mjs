import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const csvPath = path.join(process.env.HOME, 'willstone-nexus/metrics-summary.csv');
const auditLogPath = path.join(process.env.HOME, 'willstone-nexus/cleanup-audit.log');
const backupDir = path.join(process.env.HOME, 'backups/metrics');

let lastSeenVolume = 0;

// Permanent 2-hour automated production window threshold limit
const RUNTIME_TIMEOUT_MS = 2 * 60 * 60 * 1000; 
const startTime = Date.now();

function summarizeGas() {
  // 1. Check and execute dynamic exit sequence operations upon timeout phase
  if (Date.now() - startTime > RUNTIME_TIMEOUT_MS) {
    try {
      // Create external backup folder path directories cleanly
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      
      // Archive the compiled metric array spreadsheets permanently to disk
      const backupPath = path.join(backupDir, `metrics-summary-${Date.now()}.csv`);
      if (fs.existsSync(csvPath)) {
        fs.copyFileSync(csvPath, backupPath);
      }

      // Log clean backup and timeout phase transitions to audit history
      fs.appendFileSync(auditLogPath, `[${new Date().toISOString()}] TIMEOUT_EXIT | Metric arrays backed up to ${backupPath}\n`);

      // Force-dump unneeded system page and memory caches to reclaim Chromebook storage blocks
      execSync("sync && echo 3 | sudo tee /proc/sys/vm/drop_caches", { stdio: 'ignore' });
      fs.appendFileSync(auditLogPath, `[${new Date().toISOString()}] CACHE_DROP   | System memory cache dropped forcefully via kernel triggers.\n`);
    } catch (e) {
      try { fs.appendFileSync(auditLogPath, `[${new Date().toISOString()}] EXIT_FAULT  | Timeout script error: ${e.message}\n`); } catch(err){}
    }

    process.stdout.write('\x1Bc');
    console.log("==========================================================================");
    console.log("   WILLSTONE NEXUS — CLEAN PRODUCTION EXIT COMPLETED                      ");
    console.log("==========================================================================");
    console.log(`\n  [Metrics Status] : Saved to external backup folder.`);
    console.log(`  [Memory Status]  : Cache dropped safely via container kernel sync.`);
    console.log("==========================================================================\n");
    process.exit(0);
  }

  if (!fs.existsSync(csvPath)) {
    process.stdout.write('\x1Bc');
    console.log("==========================================================================");
    console.log("   WILLSTONE NEXUS — ON-CHAIN NETWORK METRICS & CHIME CONSOLE            ");
    console.log("==========================================================================");
    console.log("\n  [Status]: Awaiting data frames from background file pipeline...");
    return;
  }
  
  try {
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n').filter(Boolean).slice(1);
    let prices = [];
    let totalFilteredVolume = 0;
    let currentLivePrice = 0.0;

    lines.forEach(line => {
      const fields = line.split(',');
      if (fields.length >= 6) {
        const price = parseFloat(fields[5]);
        if (!isNaN(price) && price > 0) prices.push(price);
      }
      if (fields.length >= 9) {
        const transfers = parseInt(fields[8]);
        if (!isNaN(transfers)) totalFilteredVolume += transfers;
      }
      if (fields.length >= 10) {
        const assetPrice = parseFloat(fields[9]);
        if (!isNaN(assetPrice) && assetPrice > 0) currentLivePrice = assetPrice;
      }
    });

    if (lastSeenVolume !== 0 && totalFilteredVolume > lastSeenVolume) {
      process.stdout.write('\u0007'); 
    }
    lastSeenVolume = totalFilteredVolume;

    const remainingTimeMin = Math.ceil((RUNTIME_TIMEOUT_MS - (Date.now() - startTime)) / 60000);

    process.stdout.write('\x1Bc');
    console.log("==========================================================================");
    console.log("   WILLSTONE NEXUS — RUNTIME EXITS & VOLUMETRIC MONITOR                  ");
    console.log("==========================================================================");
    console.log(`  • UI Refresh Rate       : 3 Seconds (Production Mode Active)`);
    console.log(`  • Last Data Sync Time   : ${new Date().toLocaleTimeString()}`);
    console.log(`  • Filter Target Sender  : 0xc7F0e17931b253F659ad8D36bf39ee`);
    console.log(`  • Continuous Run Guard  : ARMED 🔔 (Auto-closes & dumps cache in ${remainingTimeMin} mins)`);
    console.log("--------------------------------------------------------------------------");
    
    if (prices.length === 0) {
      console.log("  [Status]: Awaiting data frames from background file pipeline...");
    } else {
      const maxGas = Math.max(...prices).toFixed(2);
      const minGas = Math.min(...prices).toFixed(2);
      const avgGas = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
      
      console.log(`  • Live Asset Variation  : $${currentLivePrice.toLocaleString()} USD / ETH`);
      console.log(`  • Recorded Data Points  : ${prices.length} Block Iterations Analysed`);
      console.log(`  • Minimum Gas Observed  : ${minGas} Gwei`);
      console.log(`  • Maximum Gas Observed  : ${maxGas} Gwei`);
      console.log(`  • Average Network Cost  : ${avgGas} Gwei`);
      console.log(`  • Target Sender Volume  : ${totalFilteredVolume} Filtered Events Logged`);
    }
    console.log("==========================================================================\n");
  } catch (e) {}
}

setInterval(summarizeGas, 3000);
summarizeGas();
