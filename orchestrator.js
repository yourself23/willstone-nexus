const fs = require("fs");
const { ethers } = require("ethers");

const REGISTRY_FILE = "core/config/node_registry.json";
const TRACKER_FILE = "core/config/swarm_state.json";

const providerDomain = "arb-sepolia.g.alchemy" + ".com/v2/";
const rpcUrl = "https://" + providerDomain + "XJPiqOzpgRCAf6reqQvpI";
const provider = new ethers.JsonRpcProvider(rpcUrl, { chainId: 421614, name: "arbitrum-sepolia" }, { batchMaxCount: 1 });

let iteration = 0;

async function runChaosOrchestrator() {
    iteration++;
    let timestamp = new Date().toISOString();
    let start = Date.now();
    
    try {
        const registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, "utf8"));
        const block = await provider.getBlockNumber();
        const ping = Date.now() - start;

        // Chaos Simulator Injector: Simulates a random node failure every 3 iterations
        let targetedChaosNode = null;
        if (iteration % 3 === 0) {
            const randomIndex = Math.floor(Math.random() * registry.nodes.length);
            targetedChaosNode = registry.nodes[randomIndex].id;
        }

        let totalCapacity = 0;
        let onlineNodesCount = 0;
        let distributedLoad = {};

        registry.nodes.forEach(node => {
            if (node.id === targetedChaosNode) {
                distributedLoad[node.id] = { role: node.role, status: "\x1b[31m[CRASHED_OFFLINE]\x1b[0m", allocated_concurrency: "0 tx/s" };
            } else {
                onlineNodesCount++;
                totalCapacity += node.concurrency_limit;
                distributedLoad[node.id] = { role: node.role, status: "RUNNING_OPTIMAL", allocated_concurrency: `${node.concurrency_limit} tx/s` };
            }
        });

        let stateData = {
            swarm_id: registry.swarm_id,
            last_seen: timestamp,
            current_block: block,
            latency_ms: ping,
            active_topology_nodes: onlineNodesCount,
            network_concurrency_capacity: totalCapacity,
            chaos_incident_log: targetedChaosNode ? `Programmatic blackout injected on node ${targetedChaosNode}` : "Cluster Healthy"
        };

        fs.writeFileSync(TRACKER_FILE, JSON.stringify(stateData, null, 2));

        if (targetedChaosNode) {
            console.log(`\n\x1b[31m[🔥 CHAOS FAULT INJECTED]\x1b[0m Offline Target: ${targetedChaosNode}`);
            console.log(`[SWARM ENGINE] [${timestamp}] Chaos Mode -> Active Nodes: ${onlineNodesCount}/6 | Dynamic Cap Recalculated: \x1b[33m${totalCapacity} tx/s\x1b[0m`);
        } else {
            console.log(`[SWARM ENGINE] [${timestamp}] Optimal Mode -> Block: ${block} | Latency: \x1b[32m${ping}ms\x1b[0m | Nodes: 6/6 | Cap: ${totalCapacity} tx/s`);
        }

    } catch (err) {
        console.log(`[SWARM ENGINE] [${timestamp}] Chaos Cycle Error: ${err.message}`);
    }
}

console.log("⚡ Launching Willstone Nexus Chaos Engineering & Fault Tolerance Loop...");
setInterval(runChaosOrchestrator, 10000);
runChaosOrchestrator();
