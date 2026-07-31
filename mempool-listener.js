const { JsonRpcProvider, Network, ethers } = require("ethers");

const PUBLIC_ENDPOINT = "https://arbitrum.io";
const TARGET_ACCOUNT = "0xc7F0e17931b253F659ad8D36bf39ee";

async function startAdvancedMempoolListener() {
    console.log("🛸 Launching Network Detection Bypass Engine...");
    
    try {
        // Define an explicit network object matching Arbitrum One mainnet properties
        const arbitrumNetwork = new Network("arbitrum", 42161);

        // Force-feed the Network profile straight into the constructor options
        const provider = new JsonRpcProvider(PUBLIC_ENDPOINT, arbitrumNetwork, {
            staticNetwork: arbitrumNetwork
        });
        
        console.log("🟢 Connection Bound Natively. Network probing disabled.");
        
        provider.on("block", async (blockNumber) => {
            console.log(`📦 Block Detected: #${blockNumber}`);
        });
    } catch (error) {
        console.error("❌ Port Validation Failure:", error.message);
    }
}

startAdvancedMempoolListener().catch(console.error);
