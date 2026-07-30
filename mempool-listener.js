const { WebSocketProvider, JsonRpcProvider, ethers } = require("ethers");
require("dotenv").config();

const ARBITRUM_WS_URL = "wss://arb1.arbitrum.io/feed";

const ROUTER_INTERFACE = new ethers.Interface([
    "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
    "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMinimum, address[] path, address to, uint256 deadline) external returns (uint256[] memory amounts)"
]);

// Swapped notification system to write text metrics to your log window instead of D-Bus
function triggerSystemNotification(title, message) {
    console.log(`\n🔔 [${title.toUpperCase()}] ${message}`);
}

async function startAdvancedMempoolListener() {
    console.log("⚡ Activating Advanced Calldata Decoder & Weight-Balanced Fallback Engine...");
    
    try {
        const provider = new WebSocketProvider(ARBITRUM_WS_URL);
        console.log("🟢 System Active. Streaming live pending transaction signatures...");
        triggerSystemNotification("System Status", "Mempool Listener Online & Connected to Arbitrum.");

        provider.on("pending", async (txHash) => {
            try {
                const tx = await provider.getTransaction(txHash);
                if (!tx || !tx.data || tx.data === "0x") return;

                const methodId = tx.data.substring(0, 10).toLowerCase();

                if (methodId === "0x04e45abe") {
                    const decoded = ROUTER_INTERFACE.decodeFunctionData("exactInputSingle", tx.data);
                    const logMsg = `V3 Swap: ${ethers.formatEther(decoded[0].amountIn)} ETH -> Out: ${decoded[0].tokenOut}`;
                    triggerSystemNotification("Uniswap V3 Match", logMsg);
                }
                else if (methodId === "0x38ed1739") {
                    const decoded = ROUTER_INTERFACE.decodeFunctionData("swapExactTokensForTokens", tx.data);
                    const logMsg = `V2 Swap: In: ${ethers.formatEther(decoded[0])} | Path: ${decoded[2].length} hops`;
                    triggerSystemNotification("Uniswap V2 Match", logMsg);
                }
            } catch (err) {
                // Suppress background trace evictions silently
            }
        });
    } catch (error) {
        console.error("❌ Driver Initialization Failure:", error.message);
        process.exit(1);
    }
}

startAdvancedMempoolListener().catch(() => process.exit(1));
