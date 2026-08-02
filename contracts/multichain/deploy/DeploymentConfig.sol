// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

/**
 * @title DeploymentConfig
 * @notice Static configuration for multi-chain deployment parameters.
 */
library DeploymentConfig {
    // Internal Chain IDs
    uint32 constant CHAIN_ETHEREUM = 1;
    uint32 constant CHAIN_BASE = 10;
    uint32 constant CHAIN_ARBITRUM = 20;
    uint32 constant CHAIN_POLYGON = 30;
    uint32 constant CHAIN_OPTIMISM = 40;
    uint32 constant CHAIN_AVALANCHE = 50;
    uint32 constant CHAIN_BSC = 60;
    uint32 constant CHAIN_ZKSYNC = 70;
    uint32 constant CHAIN_SCROLL = 80;
    uint32 constant CHAIN_BLAST = 90;

    // LayerZero V2 Endpoint IDs
    uint32 constant LZ_EID_ETHEREUM = 30101;
    uint32 constant LZ_EID_BASE = 30184;
    uint32 constant LZ_EID_ARBITRUM = 30110;
    uint32 constant LZ_EID_POLYGON = 30109;
    uint32 constant LZ_EID_OPTIMISM = 30111;
    uint32 constant LZ_EID_AVALANCHE = 30106;
    uint32 constant LZ_EID_BSC = 30102;
    uint32 constant LZ_EID_ZKSYNC = 30165;

    // CCIP Chain Selectors
    uint64 constant CCIP_ETHEREUM = 5009297550715157269;
    uint64 constant CCIP_BASE = 15971525489660198786;
    uint64 constant CCIP_ARBITRUM = 4949039107694359620;
    uint64 constant CCIP_POLYGON = 4051577828743386545;
    uint64 constant CCIP_OPTIMISM = 3734403246176062136;
    uint64 constant CCIP_AVALANCHE = 6433500567565415381;
    uint64 constant CCIP_BSC = 11344663589394136015;

    // Default Parameters
    uint256 constant DEFAULT_CAPTURE_RATE_BPS = 3;
    uint256 constant MAX_CAPTURE_RATE_BPS = 50;
    uint256 constant DEFAULT_CONSOLIDATION_COOLDOWN = 4 hours;
    uint256 constant MIN_CONSOLIDATION_COOLDOWN = 1 hours;
    uint256 constant DEFAULT_EPOCH_INTERVAL = 24 hours;

    // Bedrock
    uint256 constant INITIAL_BEDROCK_ATTESTATION = 450_000_000 ether;
}
