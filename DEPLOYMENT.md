# Willstone Nexus Production Deployment Checklist

### 1. Environment Verification
* Ensure **Node.js** version is `v22.23.0` or higher.
* Ensure **npm** version is `v10.9.0` or higher.
* Verify dependency mapping by confirming `ws` and `ethers` are installed locally within your project root folder (`willstone-nexus/node_modules/`).

### 2. Directory Layout Architecture
Ensure the following file system layout is preserved within the deployment directory:
* `willstone-nexus/` (Project Root)
  * `deploy_contract.js` (EVM Opcode Extraction Tool)
  * `orchestrator.js` (Chaos & Performance Engine)
  * `live_logger.js` (WebSocket Streaming Monitor)
  * `core/config/`
    * `gas_policy.json` (Sponsorship Mapping)
    * `node_registry.json` (6-Node Infrastructure Matrix)
    * `swarm_state.json` (Real-Time JSON Tracking Logs)

### 3. Secrets & Endpoint Rules
* Never hardcode your API key strings directly into shared codebases.
* Always isolate your parameters on startup using runtime environment definitions (`ALCHEMY_ID="..." node orchestrator.js`).
* Restrict your node endpoints to target networks matching **Chain ID 421614** (Arbitrum Sepolia).

### 4. Post-Deployment Verification Sequence
1. Launch `live_logger.js` via a WebSocket screen to monitor live streaming mempool telemetry.
2. Execute `orchestrator.js` to begin tracking network latency, syncing block data heights, and running the dynamic network traffic simulation.
3. Validate that `core/config/swarm_state.json` is continuously writing system updates with a target processing latency benchmark below `300ms`.
