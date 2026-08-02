import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  // Direct low-overhead JSON-RPC targeting your local DUNA Engine layer
  const LOCAL_RPC_URL = process.env.ORBIT_RPC_URL || "http://127.0.0.1:8545";
  const provider = new ethers.JsonRpcProvider(LOCAL_RPC_URL);

  const defaultPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const wallet = new ethers.Wallet(defaultPrivateKey, provider);
  const recipient = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

  async function executeTransactionTick() {
    try {
      // Send zero-value transactions directly to minimize gas tracking storage overhead
      await wallet.sendTransaction({
        to: recipient,
        value: 0,
        gasLimit: 21000,
        gasPrice: ethers.parseUnits("1", "gwei")
      });
    } catch (e) {}
  }

  // Set the loop to fire automated ticks every 3 seconds to test your display console live
  setInterval(executeTransactionTick, 3000);
  executeTransactionTick();
  await new Promise(() => {});
}

main().catch(() => {});
