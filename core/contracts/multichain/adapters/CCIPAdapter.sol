// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "../IWillstoneMessenger.sol";

/**
 * @title CCIPAdapter
 * @notice Adapter implementing IWillstoneMessenger via Chainlink CCIP.
 *         Uses Router pattern for cross-chain message delivery.
 *         Benefits: RMN (Risk Management Network) provides additional security layer.
 *         
 *         Ideal for high-value state syncs where Chainlink's defense-in-depth
 *         adds assurance beyond what DVN-only verification provides.
 */

// Minimal CCIP interfaces
interface IRouterClient {
    struct EVM2AnyMessage {
        bytes receiver;
        bytes data;
        address[] tokenAmounts; // simplified
        address feeToken;
        bytes extraArgs;
    }

    function ccipSend(
        uint64 destinationChainSelector,
        EVM2AnyMessage calldata message
    ) external payable returns (bytes32 messageId);

    function getFee(
        uint64 destinationChainSelector,
        EVM2AnyMessage calldata message
    ) external view returns (uint256 fee);
}

contract CCIPAdapter is IWillstoneMessenger {
    IRouterClient public immutable ccipRouter;
    address public owner;

    /// @notice Internal chain ID => CCIP chain selector
    mapping(uint32 => uint64) public chainToSelector;

    /// @notice CCIP chain selector => trusted sender
    mapping(uint64 => bytes32) public trustedSenders;

    modifier onlyOwner() {
        require(msg.sender == owner, "CCIP: unauthorized");
        _;
    }

    constructor(address _router) {
        ccipRouter = IRouterClient(_router);
        owner = msg.sender;
    }

    function dispatchPayload(
        uint32 dstChainId,
        bytes32 target,
        bytes calldata payload,
        bytes calldata options
    ) external payable override returns (bytes32 messageId) {
        uint64 selector = chainToSelector[dstChainId];
        require(selector != 0, "CCIP: unknown chain");

        address[] memory emptyTokens = new address[](0);

        IRouterClient.EVM2AnyMessage memory message = IRouterClient.EVM2AnyMessage({
            receiver: abi.encodePacked(target),
            data: payload,
            tokenAmounts: emptyTokens,
            feeToken: address(0), // Pay in native
            extraArgs: options
        });

        return ccipRouter.ccipSend{value: msg.value}(selector, message);
    }

    function estimateFee(
        uint32 dstChainId,
        bytes32 target,
        bytes calldata payload,
        bytes calldata options
    ) external view override returns (uint256 nativeFee, uint256 protocolFee) {
        uint64 selector = chainToSelector[dstChainId];
        require(selector != 0, "CCIP: unknown chain");

        address[] memory emptyTokens = new address[](0);

        IRouterClient.EVM2AnyMessage memory message = IRouterClient.EVM2AnyMessage({
            receiver: abi.encodePacked(target),
            data: payload,
            tokenAmounts: emptyTokens,
            feeToken: address(0),
            extraArgs: options
        });

        uint256 fee = ccipRouter.getFee(selector, message);
        return (fee, 0);
    }

    function validateInbound(
        uint32 srcChainId,
        bytes32 sender,
        bytes32 messageId,
        bytes calldata payload
    ) external override returns (bool valid) {
        uint64 selector = chainToSelector[srcChainId];
        require(selector != 0, "CCIP: unknown source");
        require(trustedSenders[selector] == sender, "CCIP: untrusted sender");
        // CCIP Router handles cryptographic verification via DONs + RMN
        return true;
    }

    function protocolId() external pure override returns (string memory) {
        return "CHAINLINK_CCIP";
    }

    function setChainMapping(uint32 internalId, uint64 ccipSelector) external onlyOwner {
        chainToSelector[internalId] = ccipSelector;
    }

    function setTrustedSender(uint64 selector, bytes32 sender) external onlyOwner {
        trustedSenders[selector] = sender;
    }
}
