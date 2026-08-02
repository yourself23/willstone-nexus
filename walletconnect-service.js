import { Core } from '@walletconnect/core';
import { SignClient } from '@walletconnect/sign-client';
import qrcode from 'qrcode-terminal';
import dotenv from 'dotenv';
dotenv.config();

async function initVisualBridge() {
  const projectId = process.env.WALLETCONNECT_PROJECT_ID || "5f8bf496dd97cb48b0d4aa3f7e251310";
  const core = new Core({ projectId });
  await core.start();

  const signClient = await SignClient.init({
    core,
    metadata: {
      name: "AppKit Platform",
      description: "Automated Gateway Terminal",
      url: "https://walletconnect.com",
      icons: ["https://githubusercontent.com"]
    }
  });

  console.log("=========================================================");
  console.log("✅ SYSTEM BRIDGE READY: ACTIVE TELEMETRY LINK ESTABLISHED");
  console.log("=========================================================");

  try {
    const { uri, approval } = await signClient.connect({
      optionalNamespaces: {
        eip155: {
          methods: ["eth_sendTransaction", "eth_signTransaction", "personal_sign", "eth_signTypedData"],
          // FIX: Switch chain from 31337 to 42161 (Arbitrum Mainnet) to satisfy Trust Wallet's structural routing checks
          chains: ["eip155:42161"],
          events: ["accountsChanged", "chainChanged"]
        }
      }
    });

    if (uri) {
      console.log("\n◈ OPEN TRUST WALLET SCANNER AND POINT CAMERA HERE:\n");
      qrcode.generate(uri, { small: true });
      console.log(`\nRaw Text Fallback: ${uri}\n`);
    }

    const session = await approval();
    console.log(`\n✅ HANDSHAKE COMPLETE: Connected to ${session.peer.metadata.name}\n`);
  } catch (err) {
    console.error("❌ Transport Broadcast Failure:", err.message);
  }
}

initVisualBridge().catch(console.error);
