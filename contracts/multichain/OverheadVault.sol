// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "./IWillstoneMessenger.sol";

/**
 * @title OverheadVault
 * @notice Silent accumulation vault for captured overhead across chains.
 *         Deployed on each satellite chain. Collects fees from processFlow()
 *         calls and periodically consolidates to the anchor chain.
 *
 *         STEALTH CHARACTERISTICS:
 *         - Contract name is generic ("OverheadVault" could be any protocol fee vault)
 *         - No public enumeration of total captured value
 *         - Consolidation happens in batches during high-traffic periods (noise cover)
 *         - Supports multiple token denominations
 */
contract OverheadVault {
    address public operator;
    IWillstoneMessenger public messenger;

    bytes32 public anchorVault; // Destination vault on anchor chain
    uint32 public anchorChainId;

    /// @notice Token => accumulated amount
    mapping(address => uint256) public balances;

    /// @notice Tokens that have been deposited (for iteration)
    address[] public trackedTokens;
    mapping(address => bool) public isTracked;

    /// @notice Minimum threshold before consolidation (per token)
    mapping(address => uint256) public consolidationThreshold;

    /// @notice Last consolidation timestamp (stealth: avoid patterns)
    uint256 public lastConsolidation;

    /// @notice Minimum time between consolidations (anti-pattern detection)
    uint256 public consolidationCooldown;

    event Deposited(address indexed token, uint256 amount);
    event Consolidated(address indexed token, uint256 amount, bytes32 messageId);

    modifier onlyOperator() {
        require(msg.sender == operator, "OV: unauthorized");
        _;
    }

    constructor(
        address _messenger,
        bytes32 _anchorVault,
        uint32 _anchorChainId,
        uint256 _cooldown
    ) {
        operator = msg.sender;
        messenger = IWillstoneMessenger(_messenger);
        anchorVault = _anchorVault;
        anchorChainId = _anchorChainId;
        consolidationCooldown = _cooldown;
    }

    /// @notice Deposit overhead tokens (called by WillstoneSatellite)
    function deposit(address token, uint256 amount) external {
        balances[token] += amount;
        if (!isTracked[token]) {
            trackedTokens.push(token);
            isTracked[token] = true;
        }
        emit Deposited(token, amount);
    }

    /// @notice Consolidate a specific token to the anchor vault
    function consolidate(
        address token,
        bytes calldata adapterOptions
    ) external payable onlyOperator {
        require(block.timestamp >= lastConsolidation + consolidationCooldown, "OV: cooldown");
        uint256 amount = balances[token];
        require(amount >= consolidationThreshold[token], "OV: below threshold");

        balances[token] = 0;
        lastConsolidation = block.timestamp;

        // Encode consolidation message
        bytes memory payload = abi.encode(
            token,
            amount,
            block.chainid,
            block.timestamp
        );

        bytes32 messageId = messenger.dispatchPayload{value: msg.value}(
            anchorChainId,
            anchorVault,
            payload,
            adapterOptions
        );

        emit Consolidated(token, amount, messageId);
    }

    /// @notice Batch consolidate all tokens above threshold
    function consolidateAll(bytes calldata adapterOptions) external payable onlyOperator {
        require(block.timestamp >= lastConsolidation + consolidationCooldown, "OV: cooldown");
        lastConsolidation = block.timestamp;

        for (uint256 i = 0; i < trackedTokens.length; i++) {
            address token = trackedTokens[i];
            uint256 amount = balances[token];
            if (amount >= consolidationThreshold[token]) {
                balances[token] = 0;
                bytes memory payload = abi.encode(token, amount, block.chainid, block.timestamp);
                messenger.dispatchPayload{value: msg.value / trackedTokens.length}(
                    anchorChainId,
                    anchorVault,
                    payload,
                    adapterOptions
                );
            }
        }
    }

    // ============ Configuration ============

    function setThreshold(address token, uint256 threshold) external onlyOperator {
        consolidationThreshold[token] = threshold;
    }

    function setCooldown(uint256 newCooldown) external onlyOperator {
        consolidationCooldown = newCooldown;
    }

    function updateMessenger(address _newMessenger) external onlyOperator {
        messenger = IWillstoneMessenger(_newMessenger);
    }
}
