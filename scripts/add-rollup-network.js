import fs from 'fs';
import path from 'path';

const configPath = path.join(process.env.HOME, 'willstone-nexus/hardhat.config.js');

console.log("==========================================================================");
console.log("   WILLSTONE NEXUS — ALCHEMY ROLLUP DEPLOYMENT CONFIGURATOR               ");
console.log("==========================================================================");

// Explicit network properties to support your custom rollup testnet execution layer
const rollupNetworkData = {
  name: "Willstone Rollup Testnet",
  url: "https://alchemy.com",
  chainId: 12345,
  currencySymbol: "ETH"
};

try {
  console.log(`• Binding Network  : ${rollupNetworkData.name}`);
  console.log(`• Injecting RPC URL: ${rollupNetworkData.url}`);
  console.log(`• Setting Chain ID : ${rollupNetworkData.chainId}`);
  
  // Appending the custom rollup configuration directly to the project environment configuration registry
  const registryPath = path.join(process.env.HOME, 'willstone-nexus/scripts/discovered-assets.json');
  let registry = { wallets: [], contracts: [], keys: [], networks: [] };
  
  if (fs.existsSync(registryPath)) {
    registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  }
  
  if (!registry.networks) registry.networks = [];
  
  // De-duplicate network list mappings before saving
  registry.networks = registry.networks.filter(n => n.chainId !== rollupNetworkData.chainId);
  registry.networks.push(rollupNetworkData);
  
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
  console.log("🟢 Success: Rollup network layers synchronized to your local asset database.");
  console.log("==========================================================================\n");
} catch (e) {
  console.log("❌ Error processing rollup integration updates:", e.message);
}
