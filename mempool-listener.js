const { ethers } = require("ethers");
require("dotenv").config();

// Consolidated high-speed infrastructure routing paths
const WEBSOCKET_URL = process.env.ALCHEMY_WS_URL || "wss://://alchemy.com";
const TARGET_ACCOUNT = "0xc7F0e17931b253F659ad8D36bf39ee"; 

async function startMempoolListener() {
    console.log("⚡ Initializing high-speed WebSocket provider stream...");
    const provider = new ethers.WebSocketProvider(WEBSOCKET_URL);

    provider._websocket.on("close", (code, reason) => {
        console.error(`⚠️ Stream severed (${code}). Re-igniting pipeline in 5s...`);
        setTimeout(startMempoolListener, 5000);
    });

    console.log("📡 Streaming live pending transaction signatures...");
    
    provider.on("pending", async (txHash) => {
        try {
            const tx = await provider.getTransaction(txHash);
            if (tx && tx.to && tx.to.toLowerCase() === TARGET_ACCOUNT.toLowerCase()) {
                console.log(`🎯 [TARGET MATCH] Hash: ${txHash}`);
                console.log(`   From: ${tx.from} | Value: ${ethers.formatEther(tx.value)} ETH`);
            }
        } catch (err) {
            // Suppresses logs for rapid evictions
        }
    });
}

startMempoolListener().catch(console.error);
