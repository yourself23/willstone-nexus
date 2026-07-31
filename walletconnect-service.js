const { Core } = require("@walletconnect/core");
const { WalletKit } = require("@reown/walletkit");
const { ethers } = require("ethers");
require("dotenv").config();

// Enforce test mode key bindings to bypass token clearance locks
const PROJECT_ID = "7560e02988978ff8cafc6c25f5b1a550"; 
const TREASURY_KEY = process.env.TREASURY_PRIVATE_KEY;
const PROVIDER_URL = process.env.ALCHEMY_RPC_URL || "https://arbitrum.io";

if (!TREASURY_KEY) {
    console.error("❌ Fatal Error: TREASURY_PRIVATE_KEY is missing.");
    process.exit(1);
}

const wallet = new ethers.Wallet(TREASURY_KEY, new ethers.JsonRpcProvider(PROVIDER_URL, new ethers.Network("arbitrum", 42161), { staticNetwork: true }));

async function startWalletKitEngine() {
    console.log("🛰️ Initializing Headless WalletConnect Engine in UAT Test Mode...");
    
    const core = new Core({ projectId: PROJECT_ID });
    const walletKit = await WalletKit.init({
        core,
        metadata: {
            name: "Willstone Nexus Test Merchant Terminal",
            description: "End-to-End Sandbox Checkout Simulator",
            url: "https://github.com",
            icons: ["https://githubusercontent.com"]
        }
    });

    console.log(`🏪 Merchant Simulator Active. Receiver Address: ${wallet.address}`);

    walletKit.on("session_proposal", async (proposal) => {
        console.log(`\n📥 [TEST CHECKOUT] Incoming payment request from mobile device...`);
        try {
            const sessionNamespaces = {
                eip155: {
                    accounts: [`eip155:42161:${wallet.address}`],
                    methods: ["eth_sendTransaction", "eth_signTransaction", "personal_sign"],
                    events: ["chainChanged", "accountsChanged"]
                }
            };
            // Approve the testing namespace session natively 
            await walletKit.approveSession({ id: proposal.id, namespaces: sessionNamespaces });
            console.log("✅ Checkout Session Approved! Customer and Merchant pathways linked.");
        } catch (err) {
            console.error("❌ Checkout Connection Refused:", err.message);
            await walletKit.rejectSession({ id: proposal.id, reason: { code: 5000, message: "Rejected" } });
        }
    });

    const pairingUri = process.argv[2];
    if (pairingUri) {
        console.log(`🔗 Pairing directly with customer checkout payload...`);
        await walletKit.pair({ uri: pairingUri });
    } else {
        console.log("⏳ Standing by. Run script with your phone checkout QR code URI text.");
    }
}

startWalletKitEngine().catch(console.error);
