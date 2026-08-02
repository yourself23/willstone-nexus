// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

/**
 * @title ChainRegistry
 * @notice Central registry mapping internal chain IDs to protocol-specific identifiers.
 *         Enables the system to expand to new chains by adding entries without
 *         modifying core contracts.
 *
 *         Internal Chain IDs:
 *         1  = Ethereum Mainnet (Anchor)
 *         10 = Base
 *         20 = Arbitrum One
 *         30 = Polygon PoS
 *         40 = Optimism
 *         50 = Avalanche C-Chain
 *         60 = BSC
 *         70 = zkSync Era
 *         80 = Scroll
 *         90 = Blast
 */
contract ChainRegistry {
    address public operator;

    struct ChainConfig {
        string name;
        uint256 nativeChainId;      // EVM chain ID
        uint32 lzEid;               // LayerZero Endpoint ID
        uint64 ccipSelector;        // CCIP chain selector
        bool hasNativeBridge;       // Whether a native L1<>L2 bridge exists
        address nativeBridgeAddr;   // Native bridge contract (if applicable)
        bool active;
        uint256 addedAt;
    }

    /// @notice Internal ID => Chain configuration
    mapping(uint32 => ChainConfig) public chains;

    /// @notice List of all registered chain IDs
    uint32[] public registeredChains;

    event ChainAdded(uint32 indexed internalId, string name, uint256 nativeChainId);
    event ChainDeactivated(uint32 indexed internalId);

    modifier onlyOperator() {
        require(msg.sender == operator, "CR: unauthorized");
        _;
    }

    constructor() {
        operator = msg.sender;
    }

    function addChain(
        uint32 internalId,
        string calldata name,
        uint256 nativeChainId,
        uint32 lzEid,
        uint64 ccipSelector,
        bool hasNativeBridge,
        address nativeBridgeAddr
    ) external onlyOperator {
        require(!chains[internalId].active, "CR: already exists");

        chains[internalId] = ChainConfig({
            name: name,
            nativeChainId: nativeChainId,
            lzEid: lzEid,
            ccipSelector: ccipSelector,
            hasNativeBridge: hasNativeBridge,
            nativeBridgeAddr: nativeBridgeAddr,
            active: true,
            addedAt: block.timestamp
        });

        registeredChains.push(internalId);
        emit ChainAdded(internalId, name, nativeChainId);
    }

    function deactivateChain(uint32 internalId) external onlyOperator {
        chains[internalId].active = false;
        emit ChainDeactivated(internalId);
    }

    function getActiveChains() external view returns (uint32[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < registeredChains.length; i++) {
            if (chains[registeredChains[i]].active) count++;
        }

        uint32[] memory active = new uint32[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < registeredChains.length; i++) {
            if (chains[registeredChains[i]].active) {
                active[idx++] = registeredChains[i];
            }
        }
        return active;
    }

    function totalChains() external view returns (uint256) {
        return registeredChains.length;
    }
}
