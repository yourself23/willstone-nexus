const { Core } = require("@walletconnect/core");
const { WalletKit } = require("@reown/walletkit");
const { ethers } = require("ethers");
require("dotenv").config();

// Consolidated credential parameter hooks
const PROJECT_ID = "7560e02988978ff8cafc6c25f5b1a550";
const TREASURY_KEY = process.env.TREASURY_PRIVATE_KEY;
const PROVIDER_URL = process.env.ALCHEMY_RPC_URL || "https://arbitrum.io";

if (!TREASURY_KEY) {
    console.error("❌ Fatal Error: TREASURY_PRIVATE_KEY is missing from your .env file.");
    process.exit(1);
}

const wallet = new ethers.Wallet(TREASURY_KEY, new ethers.JsonRpcProvider(PROVIDER_URL, new ethers.Network("arbitrum", 42161), { staticNetwork: true }));

async function startWalletKitEngine() {
    console.log("🛰️ Initializing Headless WalletConnect WalletKit Engine...");
    console.log(`📡 project ID Configuration Locked: ${PROJECT_ID}`);
    
    const core = new Core({ projectId: PROJECT_ID });
    const walletKit = await WalletKit.init({
        core,
        metadata: {
            name: "Willstone Nexus Autonomous Node",
            description: "Headless algorithmic transaction matching gateway",
            url: "https://github.com",
            icons: ["https://githubusercontent.com"]
        }
    });

    console.log(`🔒 Sovereign Node Account Bound: ${wallet.address}`);

    walletKit.on("session_proposal", async (proposal) => {
        console.log(`\n📥 [SESSION PROPOSAL] Incoming connection from: ${proposal.params.proposer.metadata.name}`);
        try {
            const sessionNamespaces = {
                eip155: {
                    accounts: [`eip155:42161:${wallet.address}`],
                    methods: ["eth_sendTransaction", "eth_signTransaction", "personal_sign"],
                    events: ["chainChanged", "accountsChanged"]
                }
            };
            await walletKit.approveSession({ id: proposal.id, namespaces: sessionNamespaces });
            console.log("✅ Connection Approved! Established session pathway.");
        } catch (err) {
            console.error("❌ Connection Refused:", err.message);
            await walletKit.rejectSession({ id: proposal.id, reason: { code: 5000, message: "Rejected" } });
        }
    });

    const pairingUri = process.argv[2];
    if (pairingUri) {
        console.log(`🔗 Pairing directly with remote session parameter...`);
        await walletKit.pair({ uri: pairingUri });
    } else {
        console.log("⏳ Standing by. Execute command string with an active dApp 'wc:' URI parameter.");
    }
}

startWalletKitEngine().catch(console.error);
