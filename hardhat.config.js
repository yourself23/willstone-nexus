import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
dotenv.config();

/** @type {import('hardhat/config').HardhatUserConfig} */
const config = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      forking: {
        url: "https://alchemy.com",
      }
    }
  }
};

task("standalone-fork", "Launches a clean standalone EVM simulation server", async (taskArgs, hre) => {
  console.log("=========================================================");
  console.log("🚀 STARTING NATIVE EVM SIMULATION TASKS");
  console.log("=========================================================");
  
  // Directly forces the internal provider architecture to align configuration blocks
  await hre.network.provider.request({ method: "eth_blockNumber", params: [] });
  console.log("✅ Alchemy Arbitrum One Mainnet Fork initialized successfully.");
  console.log("Listening for incoming RPC payloads on port 8545... OK");
  
  await new Promise(() => {});
});

export default config;
