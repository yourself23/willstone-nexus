const { WebSocketProvider } = require("ethers");
require("dotenv").config();

// Public Production WebSockets Endpoint for Arbitrum One
const ARBITRUM_WS_URL = "wss://arb1.arbitrum.io/feed";
const TARGET_ACCOUNT = "0xc7F0e17931b253F659ad8D36bf39ee"; 

async function startMempoolListener() {
    console.log("⚡ Initializing high-speed Ethers v6 WebSocket provider stream...");
    console.log(`📡 Endpoint Target: ${ARBITRUM_WS_URL}`);
    
    try {
        const provider = new WebSocketProvider(ARBITRUM_WS_URL);

        // Native Ethers v6 public websocket connection reference wrapper
        if (provider.websocket) {
            provider.websocket.on("close", (code, reason) => {
                console.error(`⚠️ Stream severed (${code}). Re-igniting pipeline in 5s...`);
                setTimeout(startMempoolListener, 5000);
            });
        }

        console.log("🟢 Connection Established. Streaming live pending transaction signatures...");
        
        provider.on("pending", async (txHash) => {
            try {
                const tx = await provider.getTransaction(txHash);
                if (tx && tx.to && tx.to.toLowerCase() === TARGET_ACCOUNT.toLowerCase()) {
                    console.log(`🎯 [TARGET MATCH] Hash: ${txHash}`);
                }
            } catch (err) {
                // Suppresses rapid pool eviction errors silently
            }
        });
    } catch (error) {
        console.error("❌ Driver Initialization Failure:", error.message);
        setTimeout(startMempoolListener, 5000);
    }
}

startMempoolListener().catch(console.error);
