import { ethers } from "ethers";
async function main() {
  const provider = new ethers.JsonRpcProvider("https://alchemy.com");
  const pk = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const wallet = new ethers.Wallet(pk, provider);
  try {
    const tx = await wallet.sendTransaction({ to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", value: 0, gasLimit: 21000 });
    console.log(`\n[Base TX Broadcasted] Hash: ${tx.hash}\n`);
  } catch (e) { console.log(`[Base TX Skipped] Balance 0 or Node Busy`); }
}
main().catch(() => {});
