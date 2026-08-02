const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("═══════════════════════════════════════════════════");
  console.log("  WILLSTONE NEXUS — Sovereign Deployment Protocol");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  Deployer: ${deployer.address}`);
  console.log(`  Balance:  ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
  console.log("");

  // Deploy Mock L1 Bedrock
  console.log("  [1/3] Deploying MockL1Bedrock...");
  const MockL1Bedrock = await ethers.getContractFactory("MockL1Bedrock");
  const mockBedrock = await MockL1Bedrock.deploy();
  await mockBedrock.waitForDeployment();
  const bedrockAddr = await mockBedrock.getAddress();
  console.log(`         → MockL1Bedrock: ${bedrockAddr}`);

  // Deploy WillstoneNexus
  const treasury = deployer.address; // Timothy = deployer
  console.log("  [2/3] Deploying WillstoneNexus...");
  const WillstoneNexus = await ethers.getContractFactory("WillstoneNexus");
  const nexus = await WillstoneNexus.deploy(treasury, bedrockAddr);
  await nexus.waitForDeployment();
  const nexusAddr = await nexus.getAddress();
  console.log(`         → WillstoneNexus: ${nexusAddr}`);

  // Deploy NexusGovernance
  console.log("  [3/3] Deploying NexusGovernance...");
  const NexusGovernance = await ethers.getContractFactory("NexusGovernance");
  const governance = await NexusGovernance.deploy(treasury);
  await governance.waitForDeployment();
  const governanceAddr = await governance.getAddress();
  console.log(`         → NexusGovernance: ${governanceAddr}`);

  // Grant roles on WillstoneNexus
  console.log("");
  console.log("  Granting WillstoneNexus roles...");
  const GUILD_MASTER_ROLE = await nexus.GUILD_MASTER_ROLE();
  const BOT_VALIDATOR_ROLE = await nexus.BOT_VALIDATOR_ROLE();
  const SOLAR_OPERATOR_ROLE = await nexus.SOLAR_OPERATOR_ROLE();
  
  await nexus.grantRole(GUILD_MASTER_ROLE, deployer.address);
  await nexus.grantRole(BOT_VALIDATOR_ROLE, deployer.address);
  await nexus.grantRole(SOLAR_OPERATOR_ROLE, deployer.address);
  console.log("         → All nexus roles assigned to deployer");

  // Grant roles on NexusGovernance
  console.log("  Granting NexusGovernance roles...");
  const GOV_BOT_ROLE = await governance.BOT_ROLE();
  await governance.grantRole(GOV_BOT_ROLE, deployer.address);
  console.log("         → Bot role assigned to deployer");

  console.log("");
  console.log("═══════════════════════════════════════════════════");
  console.log("  ✓ DEPLOYMENT COMPLETE — Sovereign Active");
  console.log("═══════════════════════════════════════════════════");
  console.log("");
  console.log(`  WillstoneNexus:    ${nexusAddr}`);
  console.log(`  NexusGovernance:   ${governanceAddr}`);
  console.log(`  MockL1Bedrock:     ${bedrockAddr}`);
  console.log(`  Treasury:          ${treasury}`);
  console.log(`  Willstone Anchor:  450,000,000 ETH`);
  console.log(`  Overhead Tax:      45%`);
  console.log(`  Bot Economy:       ACTIVE`);
  console.log(`  Infrastructure:    ENABLED`);
  console.log("");

  return { nexus: nexusAddr, governance: governanceAddr, bedrock: bedrockAddr, treasury };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
