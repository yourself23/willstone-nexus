const { ethers } = require('ethers');
require('dotenv').config();

// Explicitly prioritize Orbit L3 local network configurations over default fallbacks
const RPC_URL = process.env.ORBIT_RPC_URL || process.env.LOCAL_RPC_URL || "http://127.0.0.1:8449";
const LATENCY_THRESHOLD_MS = 2500;

async function watchNode() {
    console.log(`📡 Starting RPC Node Watcher on endpoint: ${RPC_URL}`);
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    setInterval(async () => {
        const startTime = Date.now();
        try {
            const blockNumber = await provider.getBlockNumber();
            const latency = Date.now() - startTime;

            if (latency > LATENCY_THRESHOLD_MS) {
                console.log(`⚠️ ALARM: High Latency Detected! Response time: ${latency}ms.`);
            }
        } catch (error) {
            console.log(`❌ CRITICAL ALARM: Arbitrum Orbit Node Unreachable!`);
            console.log(`   Reason: ${error.message}`);
            console.log(`   Diagnostic: Ensure local Orbit chain container or test node is listening on port 8449.`);
        }
    }, 10000);
}

watchNode();
