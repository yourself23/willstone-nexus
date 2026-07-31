const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const PROVIDER_URL = process.env.ALCHEMY_RPC_URL || "https://arbitrum.io";

async function prepareContractDeploymentPayload() {
    console.log("📲 Initializing Trust Wallet Deployment Signer Engine...");
    const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
    
    const key = process.env.TREASURY_PRIVATE_KEY;
    if (!key) {
        console.error("❌ Error: TREASURY_PRIVATE_KEY is missing from your environment.");
        return;
    }

    const wallet = new ethers.Wallet(key, provider);
    console.log(`🔒 Connected Wallet Address: ${wallet.address}`);

    // Automatically resolve the newly compiled token bytecode artifact file
    const bytecodePath = path.join(__dirname, "build", "WillstoneUtilityToken.bin");
    
    if (!fs.existsSync(bytecodePath)) {
        console.error("❌ Error: WillstoneUtilityToken.bin bytecode artifact not found in build directory. Run compile-loop.sh first.");
        return;
    }

    // Read and format raw bytecode hex payload
    let rawBytecode = fs.readFileSync(bytecodePath, "utf8").trim();
    if (!rawBytecode.startsWith("0x")) {
        rawBytecode = "0x" + rawBytecode;
    }

    // Append the initial supply argument constructor parameter to bytecode string (e.g., 1000000 tokens)
    const abiCoder = new ethers.AbiCoder();
    const encodedConstructorArgs = abiCoder.encode(["uint256"], [1000000]).substring(2);
    const deploymentDataPayload = rawBytecode + encodedConstructorArgs;

    const txDraft = {
        data: deploymentDataPayload,
        value: 0,
        gasLimit: 3000000, // Safe buffer for contract creation execution limits
        chainId: 42161 // Arbitrum One
    };

    try {
        const signedTx = await wallet.signTransaction(txDraft);
        console.log("✅ Trust Wallet Compatible Deployment Hex Generated:");
        console.log(signedTx);
    } catch (err) {
        console.error("❌ Signing Failure:", err.message);
    }
}

prepareContractDeploymentPayload();
