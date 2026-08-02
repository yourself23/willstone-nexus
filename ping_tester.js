
const { ethers } = require("ethers");
const rpcUrl = "https://" + "arb-sepolia.g.alchemy.com/v2/" + "XJPiqOzpgRCAf6reqQvpI";

// Hardcode network parameters to prevent JsonRpcProvider automatic detection failure
const provider = new ethers.JsonRpcProvider(rpcUrl, {
    chainId: 421614,
    name: "arbitrum-sepolia"
}, {
    batchMaxCount: 1 // Disables automatic parallel batching that breaks on proxy engines
});

async function runPing() {
    console.log("[PING DIAGNOSTICS] Testing Alchemy Proxy round-trip latency...");
    const start = Date.now();
    try {
        await provider.getBlockNumber();
        const latency = Date.now() - start;
        console.log(`└─ Target Node Ping: \x1b[32m${latency}ms\x1b[0m (Arbitrum Sepolia Connection Stable)\n`);
    } catch (err) {
        console.log(`└─ Latency Check \x1b[31m[FAILED]\x1b[0m: ${err.message}`);
    }
}
runPing();
