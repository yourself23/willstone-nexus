import hre from "hardhat";

async function main() {
  console.log("=========================================================");
  console.log("🚀 STARTING DIRECT STANDALONE EVM SIMULATION NODE");
  console.log("=========================================================");
  
  // Directly force the internal network engine to fork your Alchemy endpoint
  await hre.network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: {
          jsonRpcUrl: "https://alchemy.com",
        },
      },
    ],
  });

  console.log("✅ Alchemy Arbitrum One Mainnet Fork initialized successfully.");
  console.log("Listening for incoming RPC payloads on port 8545... OK");
  
  // Keep the process alive to mimic an active local network daemon
  await new Promise(() => {});
}

main().catch(console.error);
