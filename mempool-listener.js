const { WebSocketProvider, ethers } = require("ethers");
require("dotenv").config();

const ARBITRUM_WS_URL = "wss://arb1.arbitrum.io/feed";

// 1. Strict Volume Threshold Filter (Denominated in ETH value)
const MIN_ETH_VOLUME_THRESHOLD = 5.0; // Ignores any swap smaller than 5.0 ETH

// 2. High-Performance Local Token Contract Dictionary Map
const TOKEN_DICTIONARY = {
    "0x82af49447d8a07e3bd95bd0d56f352415231daa1": "WETH",
    "0x2f2a2543b76a4166549f7aa28915a1a3ba827421": "WBTC",
    "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8": "USDC.e",
    "0xaf88d065e77c8cc2239327c5edb3a432268e5831": "USDC",
    "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9": "USDT",
    "0xda10009cbd5d07dd0ddd651d4d1239b4c6a60289": "DAI",
    "0x912ce59144191c1204e64559fe8253a0e49e6548": "ARB"
};

// Safe helper to dynamically resolve symbols or return truncated fallback addresses
function resolveTokenSymbol(address) {
    if (!address) return "UNKNOWN";
    const lookup = address.toLowerCase();
    return TOKEN_DICTIONARY[lookup] || `${address.substring(0, 6)}...${address.substring(38)}`;
}

// 3. Define Advanced Decoded DEX Interface Functions
const ROUTER_INTERFACE = new ethers.Interface([
    "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
    "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMinimum, address[] path, address to, uint256 deadline) external returns (uint256[] memory amounts)"
]);

function logTargetAlert(title, message) {
    console.log(`\n🔔 [${title.toUpperCase()}] ${message}`);
}

async function startAdvancedMempoolListener() {
    console.log("⚡ Activating High-Speed Decoded Token Filter & Volume Guardian Engine...");
    console.log(`📊 Current Filter Limit: Minimum ${MIN_ETH_VOLUME_THRESHOLD} ETH Value`);
    
    try {
        const provider = new WebSocketProvider(ARBITRUM_WS_URL);
        console.log("🟢 Connection Established. Scanning signatures...");

        provider.on("pending", async (txHash) => {
            try {
                const tx = await provider.getTransaction(txHash);
                if (!tx || !tx.data || tx.data === "0x") return;

                const methodId = tx.data.substring(0, 10).toLowerCase();

                // 🟥 Uniswap V3 exactInputSingle Decoded Route
                if (methodId === "0x04e45abe") {
                    const decoded = ROUTER_INTERFACE.decodeFunctionData("exactInputSingle", tx.data);
                    const params = decoded[0] || decoded;
                    
                    // Parse raw data numbers natively into standard Ether denominations
                    const parsedAmountIn = parseFloat(ethers.formatEther(params.amountIn));
                    
                    // Apply volume constraint filters instantly
                    if (parsedAmountIn < MIN_ETH_VOLUME_THRESHOLD) return;

                    const tokenInSym = resolveTokenSymbol(params.tokenIn);
                    const tokenOutSym = resolveTokenSymbol(params.tokenOut);

                    const alertMsg = `High-Volume V3 Swap! Counted: ${parsedAmountIn.toFixed(2)} ${tokenInSym} ➡️ ${tokenOutSym}`;
                    logTargetAlert("Uniswap V3 High Volume Match", `${alertMsg}\n   Hash: ${txHash}\n   To Router: ${tx.to}`);
                }
                
                // 🟦 Uniswap V2 / SushiSwap swapExactTokensForTokens Decoded Route
                else if (methodId === "0x38ed1739") {
                    const decoded = ROUTER_INTERFACE.decodeFunctionData("swapExactTokensForTokens", tx.data);
                    const parsedAmountIn = parseFloat(ethers.formatEther(decoded.amountIn || decoded[0]));

                    if (parsedAmountIn < MIN_ETH_VOLUME_THRESHOLD) return;

                    // Parse path hops array to map direct target conversions
                    const pathArray = decoded.path || decoded[2] || [];
                    const tokenInSym = resolveTokenSymbol(pathArray[0]);
                    const tokenOutSym = resolveTokenSymbol(pathArray[pathArray.length - 1]);

                    const alertMsg = `High-Volume V2 Swap! Counted: ${parsedAmountIn.toFixed(2)} ${tokenInSym} ➡️ ${tokenOutSym} (${pathArray.length} Hops)`;
                    logTargetAlert("Uniswap V2 High Volume Match", `${alertMsg}\n   Hash: ${txHash}`);
                }
            } catch (err) {
                // Suppress background node processing evictions silently
            }
        });
    } catch (error) {
        console.error("❌ Driver Initialization Failure:", error.message);
        process.exit(1);
    }
}

startAdvancedMempoolListener().catch(() => process.exit(1));
