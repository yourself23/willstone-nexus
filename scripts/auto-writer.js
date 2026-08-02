const hre = require("hardhat");

async function main() {
  process.stdout.write('\x1Bc');
  console.log("==========================================================================");
  console.log("   AUTOMATIC ON-CHAIN CONTRACTING WRITER — HARDHAT 2 ALCHEMY MODE        ");
  console.log("==========================================================================");
  
  await hre.run("compile");
  const ContractFactory = await hre.ethers.getContractFactory("WillstoneToken");
  
  console.log("\nBroadcasting automatic deployment payload on-chain...");
  const deploymentTx = await ContractFactory.deploy();
  await deploymentTx.deployed();

  console.log("\n==========================================================================");
  console.log(`  • Status           : SUCCESS                                           `);
  console.log(`  • Deployed Node    : ${deploymentTx.address}                           `);
  console.log(`  • Execution Layer  : ${hre.network.name}                               `);
  console.log("==========================================================================\n");
}

main().catch((error) => {
  console.error("\n[Error]: Automated Contracting Writer Failed:", error.message);
  process.exit(1);
});
