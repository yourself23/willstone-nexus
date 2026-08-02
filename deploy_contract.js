import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.HARDHAT_RPC_URL || "http://127.0.0.1:8545");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log(`[Deployer] Initializing contract deployment with account: ${wallet.address}`);

  const artifactPath = "./artifacts/contracts/WillstoneToken.sol/WillstoneToken.json";
  if (!fs.existsSync(artifactPath)) {
    console.error("❌ Error: Deployer missing artifact. Make sure your pre-compiled JSON is generated.");
    process.exit(1);
  }

  const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const factory = new ethers.ContractFactory(contractArtifact.abi, contractArtifact.bytecode, wallet);

  console.log("[Deployer] Transmitting deployment transaction to local fork...");
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  console.log(`\n=========================================================`);
  console.log(`✅ DEPLOYMENT SUCCESSFUL`);
  console.log(`Infrastructure Token Address: ${await contract.getAddress()}`);
  console.log(`=========================================================\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
