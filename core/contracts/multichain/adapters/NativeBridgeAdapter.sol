// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "../IWillstoneMessenger.sol";

/**
 * @title NativeBridgeAdapter
 * @notice Emergency fallback adapter using native L2 bridge infrastructure.
 *         Supports Optimism/Base (L1CrossDomainMessenger) and Arbitrum (Inbox/Outbox).
 *         
 *         Trade-offs:
 *         - Trustless (inherits L1 security)
 *         - Slow (7-day withdrawal for L2→L1, instant for L1→L2)
 *         - No fee beyond gas
 *         
 *         Use only when both LZ and CCIP are unavailable.
 */

interface IL1CrossDomainMessenger {
    function sendMessage(
        address _target,
        bytes calldata _message,
        uint32 _minGasLimit
    ) external payable;
}

interface IArbitrumInbox {
    function createRetryableTicket(
        address to,
        uint256 l2CallValue,
        uint256 maxSubmissionCost,
        address excessFeeRefundAddress,
        address callValueRefundAddress,
        uint256 gasLimit,
        uint256 maxFeePerGas,
        bytes calldata data
    ) external payable returns (uint256);
}

contract NativeBridgeAdapter is IWillstoneMessenger {
    address public owner;

    enum BridgeType { OPTIMISM, ARBITRUM, POLYGON }

    struct BridgeConfig {
        BridgeType bridgeType;
        address bridgeContract;
        uint32 gasLimit;
    }

    mapping(uint32 => BridgeConfig) public bridgeConfigs;

    modifier onlyOwner() {
        require(msg.sender == owner, "NBA: unauthorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function dispatchPayload(
        uint32 dstChainId,
        bytes32 target,
        bytes calldata payload,
        bytes calldata options
    ) external payable override returns (bytes32 messageId) {
        BridgeConfig memory config = bridgeConfigs[dstChainId];
        require(config.bridgeContract != address(0), "NBA: unconfigured chain");

        address targetAddr = address(uint160(uint256(target)));

        if (config.bridgeType == BridgeType.OPTIMISM) {
            IL1CrossDomainMessenger(config.bridgeContract).sendMessage{value: msg.value}(
                targetAddr,
                payload,
                config.gasLimit
            );
        } else if (config.bridgeType == BridgeType.ARBITRUM) {
            // Decode options for Arbitrum-specific params
            (uint256 maxSubmission, uint256 gasPrice) = abi.decode(options, (uint256, uint256));
            IArbitrumInbox(config.bridgeContract).createRetryableTicket{value: msg.value}(
                targetAddr,
                0,
                maxSubmission,
                msg.sender,
                msg.sender,
                config.gasLimit,
                gasPrice,
                payload
            );
        }

        // Native bridges don't return a standard messageId; generate a pseudo-ID
        return keccak256(abi.encode(dstChainId, target, payload, block.timestamp));
    }

    function estimateFee(
        uint32 dstChainId,
        bytes32 target,
        bytes calldata payload,
        bytes calldata options
    ) external view override returns (uint256 nativeFee, uint256 protocolFee) {
        BridgeConfig memory config = bridgeConfigs[dstChainId];
        // Native bridges: fee is primarily gas cost, hard to estimate on-chain
        // Return conservative estimate
        if (config.bridgeType == BridgeType.ARBITRUM) {
            return (0.005 ether, 0); // ~$15 at current prices
        }
        return (0.001 ether, 0); // OP stack is cheaper
    }

    function validateInbound(
        uint32 srcChainId,
        bytes32 sender,
        bytes32 messageId,
        bytes calldata payload
    ) external override returns (bool valid) {
        // Native bridge validation is handled by the bridge contract itself
        // Messages from L1 are authenticated by the CrossDomainMessenger
        return true;
    }

    function protocolId() external pure override returns (string memory) {
        return "NATIVE_BRIDGE";
    }

    function configureBridge(
        uint32 chainId,
        BridgeType bridgeType,
        address bridgeContract,
        uint32 gasLimit
    ) external onlyOwner {
        bridgeConfigs[chainId] = BridgeConfig({
            bridgeType: bridgeType,
            bridgeContract: bridgeContract,
            gasLimit: gasLimit
        });
    }
}
