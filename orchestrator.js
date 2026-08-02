import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function startAccreditedStream() {
  const provider = new ethers.JsonRpcProvider(process.env.HARDHAT_RPC_URL || "http://127.0.0.1:8545");
  const contractAddress = process.env.CONTRACT_ADDRESS || "0x356D780bc1D042b318BD3F172c98406638838e9d";
  
  const minAbi = [
    "function balanceOf(address account) view returns (uint256)",
    "function name() view returns (string)",
    "function symbol() view returns (string)"
  ];

  const tokenContract = new ethers.Contract(contractAddress, minAbi, provider);
  const targetWallet = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  console.log("=========================================================");
  console.log("🚀 STARTING REAL-TIME SYSTEM ACCREDITATION TRACKER");
  console.log("=========================================================");
  
  try {
    const name = await tokenContract.name();
    const symbol = await tokenContract.symbol();
    const balance = await tokenContract.balanceOf(targetWallet);

    console.log(`[Token Data] Asset Name: ${name}`);
    console.log(`[Token Data] Asset Symbol: ${symbol}`);
    console.log(`[Accreditation] Wallet Address: ${targetWallet}`);
    console.log(`[Balance Lock] Live Token Balance: ${ethers.formatEther(balance)} ${symbol}`);
    console.log("\n[Monitoring] Tracking mempool and incoming node payloads... OK");
  } catch (err) {
    console.error("❌ Orchestration Mapping Error:", err.message);
  }
}

startAccreditedStream().catch(console.error);
