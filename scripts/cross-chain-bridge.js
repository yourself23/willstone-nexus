import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const LOCAL_RPC_URL = process.env.ORBIT_RPC_URL || "http://127.0.0.1:8545";
  
  // Set explicit short timeout thresholds inside the connection provider to prevent system stalls
  const provider = new ethers.JsonRpcProvider(LOCAL_RPC_URL, null, {
    timeout: 2500
  });

  const pk = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const wallet = new ethers.Wallet(pk, provider);
  const recipient = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

  async function triggerBridgeSimulation() {
    try {
      const tx = await wallet.sendTransaction({
        to: recipient,
        value: 0,
        gasLimit: 21000,
        gasPrice: ethers.parseUnits("1", "gwei")
      });
      console.log(`[${new Date().toISOString()}] TX_BROADCAST | Hash: ${tx.hash}`);
    } catch (e) {
      // Quietly intercept timeout codes and drop logs cleanly without halting the swarm daemon
      console.log(`[${new Date().toISOString()}] TX_TIMEOUT_RECOVERY | Node Busy - Skipping Frame`);
    }
  }

  setInterval(triggerBridgeSimulation, 4000);
  triggerBridgeSimulation();
  await new Promise(() => {});
}
main().catch(() => {});
