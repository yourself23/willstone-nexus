# Willstone Nexus: Stealth Multi-Chain Expansion Strategy

**Classification:** INTERNAL ONLY  
**Version:** 0.1.0  
**Date:** 2026-07-02  
**Status:** Architecture Complete / Pre-Deployment

---

## Executive Summary

This document outlines the technical strategy for expanding the Willstone Nexus across multiple EVM-compatible networks while maintaining the 450M ETH bedrock as an immutable gravitational anchor on the primary chain. The expansion is designed to be invisible to external observers, modular in execution, and perpetual in its capture mechanics.

---

## 1. Architecture Overview

### 1.1 Core Topology

```
                    ┌─────────────────────────┐
                    │   WILLSTONE ANCHOR       │
                    │   (Ethereum / Primary L2)│
                    │                          │
                    │   450M ETH Bedrock       │
                    │   Epoch State Manager    │
                    │   Overhead Accumulator   │
                    └────────┬────────────────┘
                             │
              ┌──────────────┼──────────────────┐
              │              │                   │
    ┌─────────▼──┐   ┌──────▼─────┐   ┌────────▼────┐
    │  SATELLITE  │   │  SATELLITE  │   │  SATELLITE   │
    │  Base (10)  │   │  Arb (20)   │   │  Poly (30)   │
    │             │   │             │   │              │
    │  Local Flow │   │  Local Flow │   │  Local Flow  │
    │  Processor  │   │  Processor  │   │  Processor   │
    │  Overhead   │   │  Overhead   │   │  Overhead    │
    │  Vault      │   │  Vault      │   │  Vault       │
    └─────────────┘   └─────────────┘   └──────────────┘
              │              │                   │
              └──────────────┼───────────────────┘
                             │
                    ┌────────▼────────┐
                    │ MESSENGER LAYER  │
                    │ (Adapter Pattern)│
                    │                  │
                    │ ┌──────────────┐ │
                    │ │ LayerZero V2 │ │  ← Primary (low cost, high speed)
                    │ ├──────────────┤ │
                    │ │ Chainlink    │ │  ← Fallback (high security)
                    │ │ CCIP         │ │
                    │ ├──────────────┤ │
                    │ │ Native L2    │ │  ← Emergency (trustless but slow)
                    │ │ Bridges      │ │
                    │ └──────────────┘ │
                    └─────────────────┘
```

### 1.2 Design Principles

1. **Anchor Immutability**: The 450M ETH bedrock never moves. State attestations propagate outward; value does not flow inward except as overhead consolidation.

2. **Modular Messenger**: The `IWillstoneMessenger` interface decouples all cross-chain logic from specific protocols. Adapters can be hot-swapped without redeploying core contracts.

3. **Stealth by Default**: No on-chain metadata references "Willstone". Contract names are generic. Overhead capture appears as standard protocol fees.

4. **Perpetual Expansion**: Adding a new chain requires only:
   - Deploy `WillstoneSatellite` + `OverheadVault` on the target chain
   - Register in `ChainRegistry`
   - Call `registerSatellite()` on the Anchor
   - Configure messenger adapter peer mappings

---

## 2. Interoperability Protocol Selection

### 2.1 Primary: LayerZero V2

**Rationale:**
- Lowest cost per message (~$0.01-0.05 on L2s)
- Fastest finality (sub-minute for L2-to-L2)
- Configurable DVN security (we control our trust model)
- 130+ supported chains = maximum expansion surface
- No liquidity requirements

**Configuration:**
- DVN Setup: 2-of-3 threshold (Google Cloud DVN + Polyhedra + one custom)
- Executor: Self-hosted for timing control (avoids pattern detection)
- MessageLib: ULN302 (default, well-audited)

**Chain Support:**
| Chain | LZ EID | Status |
|-------|--------|--------|
| Ethereum | 30101 | Anchor |
| Base | 30184 | Phase 1 |
| Arbitrum | 30110 | Phase 1 |
| Polygon | 30109 | Phase 1 |
| Optimism | 30111 | Phase 2 |
| Avalanche | 30106 | Phase 2 |
| BSC | 30102 | Phase 3 |
| zkSync Era | 30165 | Phase 3 |

### 2.2 Fallback: Chainlink CCIP

**Rationale:**
- Defense-in-depth (DON + RMN dual verification)
- Automatic circuit breakers on anomaly detection
- Higher cost but stronger guarantees for critical state syncs
- Good for consolidation messages (high-value, low-frequency)

**Use Cases:**
- Epoch advancement broadcasts (critical state)
- Overhead consolidation messages (high-value transfers)
- Emergency pause propagation

### 2.3 Emergency: Native L2 Bridges

**Rationale:**
- Trustless (inherits L1 security)
- 7-day withdrawal period is acceptable for emergency scenarios
- Zero external dependency

**Use Cases:**
- Protocol recovery if both LZ and CCIP are compromised
- Large-value consolidations that can tolerate latency
- Canonical token movements

---

## 3. Overhead Capture Mechanism (Multi-Chain)

### 3.1 How It Works

The overhead capture is the economic engine of perpetual expansion. On each satellite chain:

1. **Integration Points**: The `WillstoneSatellite.processFlow()` function is called by integrated protocols (DEXs, lending markets, vaults) as part of their fee routing.

2. **Silent Deduction**: A configurable basis-point fee (default: 3 bps = 0.03%) is deducted from each flow. This is below the noise floor of typical protocol fees (which range 5-30 bps).

3. **Local Accumulation**: Overhead collects in the `OverheadVault` contract on each chain.

4. **Periodic Consolidation**: When thresholds are met (and timing is randomized to avoid patterns), the vault consolidates to the Anchor via the messenger layer.

5. **Anchor Accounting**: The Anchor tracks total overhead across all chains, providing a unified view of the capture rate.

### 3.2 Stealth Characteristics

- **Below Detection Threshold**: 3 bps is indistinguishable from rounding errors in most protocols.
- **Variable Timing**: Consolidation cooldowns are randomized (not periodic) to avoid on-chain analytics pattern detection.
- **Multi-Token**: Captures in whatever denomination flows through (ETH, USDC, WBTC, etc.), avoiding concentration in a single asset.
- **No Public Totals**: The `localOverhead` variable resets after each consolidation. Total lifetime capture is only visible at the Anchor level.

### 3.3 Scaling Model

| Monthly Volume (per chain) | Capture Rate | Monthly Overhead |
|---------------------------|--------------|------------------|
| $100M | 3 bps | $30,000 |
| $500M | 3 bps | $150,000 |
| $1B | 3 bps | $300,000 |
| $5B | 2 bps (reduced at scale) | $1,000,000 |

**Projected across 8 chains at $500M avg volume: $1.2M/month passive capture.**

---

## 4. Deployment Phases

### Phase 1: Foundation (Weeks 1-4)

- [ ] Deploy `ChainRegistry` on Ethereum
- [ ] Deploy `WillstoneAnchor` with initial 450M attestation
- [ ] Deploy `LayerZeroAdapter` on Ethereum
- [ ] Deploy `WillstoneSatellite` + `OverheadVault` on Base
- [ ] Deploy `WillstoneSatellite` + `OverheadVault` on Arbitrum
- [ ] Deploy `WillstoneSatellite` + `OverheadVault` on Polygon
- [ ] Configure LZ peer mappings and DVN settings
- [ ] Test epoch sync cycle (Anchor → Satellites)
- [ ] Test overhead consolidation cycle (Satellites → Anchor)

### Phase 2: Integration (Weeks 5-8)

- [ ] Deploy `CCIPAdapter` as fallback messenger
- [ ] Integrate `processFlow()` with 2-3 DeFi protocols per chain
- [ ] Establish baseline overhead capture rates
- [ ] Deploy monitoring (off-chain, no dashboard exposure)
- [ ] Expand to Optimism and Avalanche
- [ ] Begin randomized consolidation schedule

### Phase 3: Perpetual Expansion (Weeks 9+)

- [ ] Add BSC, zkSync Era, Scroll, Blast
- [ ] Implement adaptive capture rate (auto-adjusts based on volume)
- [ ] Deploy cross-chain arbitrage detector (identifies expansion opportunities)
- [ ] Build automated satellite deployment pipeline
- [ ] Implement multi-messenger redundancy (simultaneous LZ + CCIP for critical messages)

---

## 5. Security Model

### 5.1 Attack Surface Minimization

| Vector | Mitigation |
|--------|-----------|
| Messenger compromise | Multi-adapter fallback; no single point of failure |
| State sync manipulation | Epoch nonces prevent replay; anchor is source of truth |
| Overhead detection | Sub-noise-floor rate; randomized timing; generic contract names |
| Operator key compromise | Timelock on critical operations; multi-sig for messenger changes |
| Chain-specific exploit | Satellites are isolated; one compromised chain cannot affect others |

### 5.2 Operational Security

- **Contract Deployment**: Use fresh deployer wallets per chain (no address correlation)
- **Gas Funding**: Fund deployers from different sources (CEX withdrawals, tornado-adjacent privacy)
- **Naming Convention**: All on-chain contracts use generic names (StateReceiver, FeeVault, MessageRelay)
- **No Verified Source**: Do NOT verify contract source on block explorers (stealth > transparency)
- **Monitoring**: Off-chain only, no subgraph, no public indexer

### 5.3 Emergency Procedures

1. **Pause All**: Anchor operator calls `emergencyPause()` → propagates via messenger to all satellites
2. **Messenger Swap**: If LZ is compromised, switch all adapters to CCIP in one transaction
3. **Satellite Isolation**: Deactivate individual chains without affecting others
4. **Overhead Recovery**: If a vault is compromised, remaining vaults continue independently

---

## 6. Contract Architecture (File Map)

```
contracts/multichain/
├── IWillstoneMessenger.sol      # Abstract messenger interface
├── WillstoneAnchor.sol          # Primary anchor (Ethereum)
├── WillstoneSatellite.sol       # Per-chain satellite
├── OverheadVault.sol            # Per-chain fee accumulator
├── ChainRegistry.sol            # Chain ID mapping registry
└── adapters/
    ├── LayerZeroAdapter.sol     # LZ V2 OApp adapter
    └── CCIPAdapter.sol          # Chainlink CCIP adapter
```

---

## 7. Non-Surfaced Elements

The following are explicitly excluded from the main Willstone Nexus dashboard:

- Multi-chain satellite status
- Overhead capture rates/totals
- Cross-chain message history
- Chain registry state
- Consolidation schedules

These will be accessible only via direct contract reads by authorized operators.

---

## 8. Future Considerations

- **L3 Appchains**: Deploy dedicated Willstone appchain (via OP Stack or Arbitrum Orbit) for internal settlement, further reducing visibility.
- **Non-EVM Expansion**: Solana, Sui, Aptos via LayerZero's non-EVM endpoints.
- **ZK-Proofed State**: Replace messenger-based sync with ZK state proofs for trustless cross-chain verification.
- **Autonomous Expansion**: Smart contract that automatically deploys satellites when new chains reach volume thresholds.

---

*This document is not to be shared externally or referenced in any public-facing materials.*
