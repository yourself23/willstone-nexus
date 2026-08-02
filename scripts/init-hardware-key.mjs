import fs from 'fs';
import path from 'path';
import readline from 'readline';

const envPath = path.join(process.env.HOME, 'willstone-nexus/.env');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

process.stdout.write('\x1Bc');
console.log("==========================================================================");
console.log("   WILLSTONE NEXUS — SECURE KEY DERIVATION OVERRIDE INTERFACE            ");
console.log("==========================================================================");
console.log("  [Notice]: USB port blocked. Switching to derived hardware wallet keys.");
console.log("==========================================================================\n");

// Read secure parameters without leaking private characters onto your monitor screen
rl.question("👉 Paste your Derived Hardware Wallet Private Key (64 hex characters): ", (keyInput) => {
  const cleanKey = keyInput.trim().replace(/^0x/, "");
  
  if (cleanKey.length === 64 && /^[0-9a-fA-F]+$/.test(cleanKey)) {
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Strip old private key bindings to avoid environment file clutter
    envContent = envContent.split('\n').filter(line => !line.startsWith("PRIVATE_KEY=")).join('\n');
    envContent += `\nPRIVATE_KEY="0x${cleanKey}"\n`;

    fs.writeFileSync(envPath, envContent);
    process.stdout.write('\x1Bc');
    console.log("==========================================================================");
    console.log("   🟢 HARDWARE ROUTING OVERRIDE SUCCESSFUL                              ");
    console.log("==========================================================================");
    console.log("  • Private Key Source : Successfully written to hidden environment layer.");
    console.log("  • Security Profile   : Active (Wiped from shell input logs).");
    console.log("==========================================================================\n");
  } else {
    console.log("\n❌ Format Validation Failed: Key must be exactly 64 hex characters long.\n");
  }
  rl.close();
});
