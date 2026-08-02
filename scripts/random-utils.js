import fs from 'fs';
import path from 'path';

const csvPath = path.join(process.env.HOME, 'willstone-nexus/metrics-summary.csv');

// List of randomized network nodes and module aliases to prevent terminal profile mapping
const prefixes = ["Sovereign", "Nexus", "Freq", "DUNA", "Quantum", "Shadow", "Alpha", "Hyper"];
const suffixes = ["Swarm", "Node", "Vault", "Bridge", "Engine", "Kernel", "Core", "Cluster"];

export function generateRandomHandle() {
  const randPre = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randSuf = suffixes[Math.floor(Math.random() * suffixes.length)];
  const randNum = Math.floor(100 + Math.random() * 900);
  return `${randPre}_${randSuf}_${randNum}`;
}

// Discount Matrix Calculation: Adjusts gas thresholds for prioritized service accounts
export function calculateDiscountedThreshold(baseThreshold, accountType) {
  let discountMultiplier = 1.0;
  
  switch(accountType.toLowerCase()) {
    case 'premium':
      discountMultiplier = 0.85; // 15% lower threshold ceiling for high-priority streams
      break;
    case 'discount':
      discountMultiplier = 0.70; // 30% wider operational boundary for discounted lanes
      break;
    default:
      discountMultiplier = 1.0;
  }
  
  return (baseThreshold * discountMultiplier).toFixed(2);
}

console.log("==========================================================================");
console.log("   WILLSTONE NEXUS — RANDOMIZED HANDLES & DISCOUNT GENERATOR              ");
console.log("==========================================================================");
console.log(` • Generated Handle Target : ${generateRandomHandle()}`);
console.log(` • Base Threshold Boundary : 30.0 Gwei`);
console.log(` • Premium Discount Cutoff : ${calculateDiscountedThreshold(30.0, 'premium')} Gwei`);
console.log(` • Discount Account Boundary: ${calculateDiscountedThreshold(30.0, 'discount')} Gwei`);
console.log("==========================================================================\n");
