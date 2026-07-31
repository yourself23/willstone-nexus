const { ethers } = require("ethers");
require("dotenv").config();

const PROVIDER_URL = process.env.ALCHEMY_RPC_URL || "https://arbitrum.io";

async function prepareTrustPayload() {
    console.log("📲 Initializing Trust Wallet Payload Signer Engine...");
    const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
    
    const key = process.env.TREASURY_PRIVATE_KEY;
    if (!key) {
        console.error("❌ Error: TREASURY_PRIVATE_KEY is missing from your environment.");
        return;
    }

    const wallet = new ethers.Wallet(key, provider);
    console.log(`🔒 Connected Wallet Address: ${wallet.address}`);

    // Draft a baseline mock transaction payload for validation
    const txDraft = {
        to: "0xc7F0e17931b253F659ad8D36bf39ee",
        value: ethers.parseEther("0.001"),
        gasLimit: 21000,
        chainId: 42161 // Arbitrum One
    };

    try {
        const signedTx = await wallet.signTransaction(txDraft);
        console.log("✅ Trust Wallet Compatible Signed Hex Generated:");
        console.log(signedTx);
    } catch (err) {
        console.error("❌ Signing Failure:", err.message);
    }
}

prepareTrustPayload();
