// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "../IWillstoneMessenger.sol";

/**
 * @title LayerZeroAdapter
 * @notice Adapter implementing IWillstoneMessenger via LayerZero V2 OApp pattern.
 *         Wraps LZ endpoint calls behind the unified messenger interface.
 *         
 *         Production deployment requires:
 *         - LayerZero Endpoint address per chain
 *         - DVN configuration (recommend 2-of-3 for stealth operations)
 *         - Executor gas settings per destination
 */

// Minimal LZ V2 interfaces
interface ILayerZeroEndpointV2 {
    struct MessagingParams {
        uint32 dstEid;
        bytes32 receiver;
        bytes message;
        bytes options;
        bool payInLzToken;
    }

    struct MessagingFee {
        uint256 nativeFee;
        uint256 lzTokenFee;
    }

    struct MessagingReceipt {
        bytes32 guid;
        uint64 nonce;
        MessagingFee fee;
    }

    function send(
        MessagingParams calldata _params,
        address _refundAddress
    ) external payable returns (MessagingReceipt memory);

    function quote(
        MessagingParams calldata _params,
        address _sender
    ) external view returns (MessagingFee memory);
}

contract LayerZeroAdapter is IWillstoneMessenger {
    ILayerZeroEndpointV2 public immutable lzEndpoint;
    address public owner;

    mapping(uint32 => uint32) public chainToEid;
    mapping(uint32 => bytes32) public peers;
    mapping(uint32 => uint64) public inboundNonce;

    modifier onlyOwner() {
        require(msg.sender == owner, "LZA: unauthorized");
        _;
    }

    constructor(address _endpoint) {
        lzEndpoint = ILayerZeroEndpointV2(_endpoint);
        owner = msg.sender;
    }

    function dispatchPayload(
        uint32 dstChainId,
        bytes32 target,
        bytes calldata payload,
        bytes calldata options
    ) external payable override returns (bytes32 messageId) {
        uint32 dstEid = chainToEid[dstChainId];
        require(dstEid != 0, "LZA: unknown chain");

        ILayerZeroEndpointV2.MessagingParams memory params = ILayerZeroEndpointV2.MessagingParams({
            dstEid: dstEid,
            receiver: target,
            message: payload,
            options: options,
            payInLzToken: false
        });

        ILayerZeroEndpointV2.MessagingReceipt memory receipt = 
            lzEndpoint.send{value: msg.value}(params, msg.sender);

        return receipt.guid;
    }

    function estimateFee(
        uint32 dstChainId,
        bytes32 target,
        bytes calldata payload,
        bytes calldata options
    ) external view override returns (uint256 nativeFee, uint256 protocolFee) {
        uint32 dstEid = chainToEid[dstChainId];
        require(dstEid != 0, "LZA: unknown chain");

        ILayerZeroEndpointV2.MessagingParams memory params = ILayerZeroEndpointV2.MessagingParams({
            dstEid: dstEid,
            receiver: target,
            message: payload,
            options: options,
            payInLzToken: false
        });

        ILayerZeroEndpointV2.MessagingFee memory fee = lzEndpoint.quote(params, msg.sender);
        return (fee.nativeFee, fee.lzTokenFee);
    }

    function validateInbound(
        uint32 srcChainId,
        bytes32 sender,
        bytes32 messageId,
        bytes calldata payload
    ) external override returns (bool valid) {
        uint32 srcEid = chainToEid[srcChainId];
        require(srcEid != 0, "LZA: unknown source");
        require(peers[srcEid] == sender, "LZA: untrusted peer");
        return true;
    }

    function protocolId() external pure override returns (string memory) {
        return "LAYERZERO_V2";
    }

    function setChainMapping(uint32 internalId, uint32 lzEid) external onlyOwner {
        chainToEid[internalId] = lzEid;
    }

    function setPeer(uint32 eid, bytes32 peerAddress) external onlyOwner {
        peers[eid] = peerAddress;
    }

    function lzReceive(
        uint32 _srcEid,
        bytes32 _sender,
        bytes32 _guid,
        bytes calldata _message,
        bytes calldata /*_extraData*/
    ) external {
        require(msg.sender == address(lzEndpoint), "LZA: invalid endpoint");
        require(peers[_srcEid] == _sender, "LZA: untrusted peer");
    }
}
