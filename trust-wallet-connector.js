import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

/**
 * Encodes and routes transaction payloads directly through your open JSON-RPC network port.
 * Bypasses UI prompt bottlenecks for server-side pipeline handling.
 */
export async function broadcastTrustWalletPayload(session, transactionPayload) {
  const providerUrl = process.env.HARDHAT_RPC_URL || "http://127.0.0.1:8545";
  console.log(`[Trust Bridge] Initializing broadcast routing via RPC: ${providerUrl}`);
  
  const customProvider = new ethers.JsonRpcProvider(providerUrl);
  
  if (!session || !session.topic) {
    console.warn("[Trust Bridge] No active WalletConnect session mapping detected. Falling back to local signer...");
  }

  try {
    const txResponse = await customProvider.send("eth_sendTransaction", [transactionPayload]);
    console.log(`✅ Transaction Broadcast Confirmed. Hash identifier: ${txResponse}`);
    return txResponse;
  } catch (error) {
    console.error("❌ Payload Broadcast Failure:", error.message);
    throw error;
  }
}
