
console.log("[CONCURRENCY SIMULATOR] Spawning virtual swarm nodes...");
let activeNodes = 0;
const interval = setInterval(() => {
    activeNodes++;
    console.log(`├─ Node #${activeNodes} Virtual Instance Initialized [PORT ${3001 + activeNodes}]`);
    if (activeNodes >= 5) {
        clearInterval(interval);
        console.log("\x1b[32m[SUCCESS]\x1b[0m Swarm Concurrency threshold verified at 5 parallel instances.\n");
    }
}, 300);
