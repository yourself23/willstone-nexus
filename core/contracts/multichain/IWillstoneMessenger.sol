// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

/**
 * @title IWillstoneMessenger
 * @notice Abstract messenger interface for cross-chain communication.
 *         Decouples bridge logic from the underlying protocol (LayerZero, CCIP, custom).
 *         Allows hot-swapping interop providers without redeploying core contracts.
 */
interface IWillstoneMessenger {
    /// @notice Send an encoded payload to a destination chain
    /// @param dstChainId The internal chain identifier (mapped to protocol-specific IDs)
    /// @param target The receiving contract address on the destination chain
    /// @param payload ABI-encoded message data
    /// @param options Protocol-specific adapter parameters (gas limits, DVN configs, etc.)
    /// @return messageId Unique identifier for tracking
    function dispatchPayload(
        uint32 dstChainId,
        bytes32 target,
        bytes calldata payload,
        bytes calldata options
    ) external payable returns (bytes32 messageId);

    /// @notice Estimate the fee for dispatching a payload
    function estimateFee(
        uint32 dstChainId,
        bytes32 target,
        bytes calldata payload,
        bytes calldata options
    ) external view returns (uint256 nativeFee, uint256 protocolFee);

    /// @notice Validate an inbound message from a source chain
    function validateInbound(
        uint32 srcChainId,
        bytes32 sender,
        bytes32 messageId,
        bytes calldata payload
    ) external returns (bool valid);

    /// @notice Returns the protocol identifier (e.g., "LAYERZERO_V2", "CCIP", "NATIVE")
    function protocolId() external pure returns (string memory);
}
