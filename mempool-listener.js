const { JsonRpcProvider, ethers } = require("ethers");
require("dotenv").config();

// 💡 Dynamically load your HTTPS endpoint from your .env file
const HTTP_RPC_URL = process.env.ALCHEMY_RPC_URL || "https://arbitrum.io";
const MIN_ETH_VOLUME_THRESHOLD = 0.01; 

const TOKEN_DICTIONARY = {
    "0x82af49447d8a07e3bd95bd0d56f352415231daa1": "WETH",
    "0x2f2a2543b76a4166549f7aa28915a1a3ba827421": "WBTC",
    "0xaf88d065e77c8cc2239327c5edb3a432268e5831": "USDC",
    "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9": "USDT"
};

function resolveTokenSymbol(address) {
    if (!address) return "UNKNOWN";
    const lookup = address.toLowerCase();
    return TOKEN_DICTIONARY[lookup] || `${address.substring(0, 6)}...${address.substring(38)}`;
}

const ROUTER_INTERFACE = new ethers.Interface([
    "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
    "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMinimum, address[] path, address to, uint256 deadline) external returns (uint256[] memory amounts)"
]);

async function startAdvancedMempoolListener() {
    console.log("⚡ Activating High-Speed HTTPS Block-Polling Tracker Engine...");
    console.log(`📡 Targeting Native Endpoint: ${HTTP_RPC_URL}`);
    console.log(`📊 Filter Limit: Minimum ${MIN_ETH_VOLUME_THRESHOLD} ETH Value`);
    
    try {
        // Enforce the standard JSON-RPC provider pattern for HTTPS connections
        const provider = new JsonRpcProvider(HTTP_RPC_URL);
        console.log("🟢 Connection Established. Scanning incoming blocks over HTTP...");

        provider.on("block", async (blockNumber) => {
            try {
                // Request the block along with all transaction objects
                const block = await provider.getBlock(blockNumber, true);
                if (!block || !block.prefetchedTransactions) return;

                process.stdout.write("📦"); // Print block indicator

                for (const tx of block.prefetchedTransactions) {
                    if (!tx || !tx.data || tx.data === "0x") continue;

                    const methodId = tx.data.substring(0, 10).toLowerCase();

                    if (methodId === "0x04e45abe") {
                        const decoded = ROUTER_INTERFACE.decodeFunctionData("exactInputSingle", tx.data);
                        const params = decoded;
                        const parsedAmountIn = parseFloat(ethers.formatEther(params.amountIn || 0));
                        
                        if (parsedAmountIn < MIN_ETH_VOLUME_THRESHOLD) continue;

                        const tokenInSym = resolveTokenSymbol(params.tokenIn);
                        const tokenOutSym = resolveTokenSymbol(params.tokenOut);

                        console.log(`\n\n🎯 [V3 MATCH] Block: ${blockNumber} | Hash: ${tx.hash}`);
                        console.log(`   🔥 Volume: ${parsedAmountIn.toFixed(4)} ${tokenInSym} ➡️ ${tokenOutSym}`);
                    }
                    
                    else if (methodId === "0x38ed1739") {
                        const decoded = ROUTER_INTERFACE.decodeFunctionData("swapExactTokensForTokens", tx.data);
                        const parsedAmountIn = parseFloat(ethers.formatEther(decoded[0] || decoded || 0));

                        if (parsedAmountIn < MIN_ETH_VOLUME_THRESHOLD) continue;

                        const pathArray = decoded.path || decoded || [];
                        const tokenInSym = resolveTokenSymbol(pathArray[0]);
                        const tokenOutSym = resolveTokenSymbol(pathArray[pathArray.length - 1]);

                        console.log(`\n\n🎯 [V2 MATCH] Block: ${blockNumber} | Hash: ${tx.hash}`);
                        console.log(`   🔥 Volume: ${parsedAmountIn.toFixed(4)} ${tokenInSym} ➡️ ${tokenOutSym}`);
                    }
                }
            } catch (blockErr) {
                // Gracefully catch internal missing block structures
            }
        });
    } catch (error) {
        console.error("❌ Driver Initialization Failure:", error.message);
        process.exit(1);
    }
}

startAdvancedMempoolListener().catch(() => process.exit(1));
