// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title WillstoneNexus
 * @notice Production-grade L2/L3 bridge with Guild Trade validation,
 *         Solar Export logic, and configurable overhead tax.
 */
contract WillstoneNexus is AccessControl, EIP712, ReentrancyGuard, Pausable {
    using ECDSA for bytes32;

    // ─── Roles ───────────────────────────────────────────────────────
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");
    bytes32 public constant GUILD_MASTER_ROLE = keccak256("GUILD_MASTER_ROLE");
    bytes32 public constant BOT_VALIDATOR_ROLE = keccak256("BOT_VALIDATOR_ROLE");
    bytes32 public constant SOLAR_OPERATOR_ROLE = keccak256("SOLAR_OPERATOR_ROLE");

    // ─── EIP-712 Type Hashes ─────────────────────────────────────────
    bytes32 public constant GUILD_TRADE_TYPEHASH = keccak256(
        "GuildTrade(uint256 guildId,address trader,uint256 amount,uint256 nonce,uint256 deadline)"
    );

    bytes32 public constant BOT_TRANSACTION_TYPEHASH = keccak256(
        "BotTransaction(address bot,uint256 action,uint256 value,uint256 nonce,uint256 deadline)"
    );

    // ─── State ───────────────────────────────────────────────────────
    uint256 public constant WILLSTONE_ANCHOR = 450_000_000 ether;
    uint256 public overheadTaxBps = 4500; // 45% in basis points
    uint256 public constant MAX_TAX_BPS = 10000;

    address public treasury;
    address public l1BedrockBridge;

    uint256 public totalBridgedToL1;
    uint256 public totalBridgedFromL1;
    uint256 public totalGuildVolume;

    // Guild state
    enum GuildId { SOVEREIGN, NEXUS, CELESTIAL, FORGE, VOID }
    
    struct Guild {
        string name;
        uint256 totalVolume;
        uint256 memberCount;
        bool active;
        uint256 botBehaviorFlags;
    }

    struct TradeLog {
        uint256 guildId;
        address trader;
        uint256 amount;
        uint256 tax;
        uint256 timestamp;
        bool isSovereign;
    }

    mapping(uint256 => Guild) public guilds;
    mapping(address => uint256) public traderNonces;
    mapping(address => uint256) public botNonces;
    mapping(uint256 => TradeLog[]) public guildTradeLogs;

    // Solar Export state
    struct SolarExport {
        uint256 amount;
        bytes32 l1TxHash;
        uint256 timestamp;
        bool settled;
    }

    SolarExport[] public solarExports;

    // ─── Events ──────────────────────────────────────────────────────
    event GuildTradeExecuted(
        uint256 indexed guildId,
        address indexed trader,
        uint256 amount,
        uint256 tax,
        uint256 nonce
    );
    event SolarExportInitiated(uint256 indexed exportId, uint256 amount, address operator);
    event SolarExportSettled(uint256 indexed exportId, bytes32 l1TxHash);
    event BridgeDeposit(address indexed from, uint256 amount, uint256 l1Amount);
    event BridgeWithdrawal(address indexed to, uint256 amount);
    event OverheadTaxUpdated(uint256 oldTax, uint256 newTax);
    event GuildBotBehaviorUpdated(uint256 indexed guildId, uint256 flags);
    event BotTransactionValidated(address indexed bot, uint256 action, uint256 value);

    // ─── Constructor ─────────────────────────────────────────────────
    constructor(
        address _treasury,
        address _l1BedrockBridge
    ) EIP712("WillstoneNexus", "1") {
        treasury = _treasury;
        l1BedrockBridge = _l1BedrockBridge;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TREASURY_ROLE, _treasury);

        // Initialize 5 Guilds
        guilds[uint256(GuildId.SOVEREIGN)] = Guild("Sovereign Authority", 0, 0, true, 0);
        guilds[uint256(GuildId.NEXUS)] = Guild("Nexus Command", 0, 0, true, 0);
        guilds[uint256(GuildId.CELESTIAL)] = Guild("Celestial Order", 0, 0, true, 0);
        guilds[uint256(GuildId.FORGE)] = Guild("Forge Collective", 0, 0, true, 0);
        guilds[uint256(GuildId.VOID)] = Guild("Void Syndicate", 0, 0, true, 0);
    }

    // ─── Guild Trade (EIP-712 validated) ─────────────────────────────
    function executeGuildTrade(
        uint256 guildId,
        uint256 amount,
        uint256 deadline,
        bytes calldata signature
    ) external payable nonReentrant whenNotPaused {
        require(block.timestamp <= deadline, "WN: Trade expired");
        require(guildId < 5, "WN: Invalid guild");
        require(guilds[guildId].active, "WN: Guild inactive");
        require(msg.value >= amount, "WN: Insufficient value");

        uint256 nonce = traderNonces[msg.sender]++;

        // EIP-712 signature verification
        bytes32 structHash = keccak256(abi.encode(
            GUILD_TRADE_TYPEHASH,
            guildId,
            msg.sender,
            amount,
            nonce,
            deadline
        ));
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);
        require(
            hasRole(GUILD_MASTER_ROLE, signer) || hasRole(BOT_VALIDATOR_ROLE, signer),
            "WN: Invalid signature authority"
        );

        // Calculate tax
        uint256 tax = (amount * overheadTaxBps) / MAX_TAX_BPS;
        uint256 netAmount = amount - tax;

        // Transfer tax to treasury
        (bool taxSent,) = treasury.call{value: tax}("");
        require(taxSent, "WN: Tax transfer failed");

        // Update state
        guilds[guildId].totalVolume += amount;
        totalGuildVolume += amount;

        guildTradeLogs[guildId].push(TradeLog({
            guildId: guildId,
            trader: msg.sender,
            amount: amount,
            tax: tax,
            timestamp: block.timestamp,
            isSovereign: guildId == uint256(GuildId.SOVEREIGN)
        }));

        emit GuildTradeExecuted(guildId, msg.sender, amount, tax, nonce);

        // Refund excess
        if (msg.value > amount) {
            (bool refundSent,) = msg.sender.call{value: msg.value - amount}("");
            require(refundSent, "WN: Refund failed");
        }
    }

    // ─── Bot Transaction Validation (EIP-712) ────────────────────────
    function validateBotTransaction(
        address bot,
        uint256 action,
        uint256 value,
        uint256 deadline,
        bytes calldata signature
    ) external nonReentrant whenNotPaused {
        require(block.timestamp <= deadline, "WN: Tx expired");
        
        uint256 nonce = botNonces[bot]++;

        bytes32 structHash = keccak256(abi.encode(
            BOT_TRANSACTION_TYPEHASH,
            bot,
            action,
            value,
            nonce,
            deadline
        ));
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);
        require(hasRole(BOT_VALIDATOR_ROLE, signer), "WN: Invalid bot authority");

        emit BotTransactionValidated(bot, action, value);
    }

    // ─── Solar Export (L1 Bedrock interaction) ────────────────────────
    function initiateSolarExport(uint256 amount) 
        external 
        onlyRole(SOLAR_OPERATOR_ROLE) 
        nonReentrant 
        whenNotPaused 
    {
        require(amount > 0, "WN: Zero amount");
        require(address(this).balance >= amount, "WN: Insufficient balance");

        uint256 exportId = solarExports.length;
        solarExports.push(SolarExport({
            amount: amount,
            l1TxHash: bytes32(0),
            timestamp: block.timestamp,
            settled: false
        }));

        // Mock L1 Bedrock bridge call
        (bool sent,) = l1BedrockBridge.call{value: amount}(
            abi.encodeWithSignature("depositETH(uint256,bytes)", amount, "")
        );
        require(sent, "WN: L1 bridge call failed");

        totalBridgedToL1 += amount;
        emit SolarExportInitiated(exportId, amount, msg.sender);
    }

    function settleSolarExport(uint256 exportId, bytes32 l1TxHash) 
        external 
        onlyRole(SOLAR_OPERATOR_ROLE) 
    {
        require(exportId < solarExports.length, "WN: Invalid export");
        require(!solarExports[exportId].settled, "WN: Already settled");

        solarExports[exportId].l1TxHash = l1TxHash;
        solarExports[exportId].settled = true;

        emit SolarExportSettled(exportId, l1TxHash);
    }

    // ─── Bridge Operations ───────────────────────────────────────────
    function bridgeFromL1() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "WN: Zero deposit");
        totalBridgedFromL1 += msg.value;
        emit BridgeDeposit(msg.sender, msg.value, msg.value);
    }

    // ─── Treasury Controls (Timothy) ─────────────────────────────────
    function setOverheadTax(uint256 newTaxBps) external onlyRole(TREASURY_ROLE) {
        require(newTaxBps <= MAX_TAX_BPS, "WN: Tax exceeds max");
        uint256 oldTax = overheadTaxBps;
        overheadTaxBps = newTaxBps;
        emit OverheadTaxUpdated(oldTax, newTaxBps);
    }

    function setGuildBotBehavior(uint256 guildId, uint256 flags) 
        external 
        onlyRole(GUILD_MASTER_ROLE) 
    {
        require(guildId < 5, "WN: Invalid guild");
        guilds[guildId].botBehaviorFlags = flags;
        emit GuildBotBehaviorUpdated(guildId, flags);
    }

    function toggleGuild(uint256 guildId, bool active) external onlyRole(TREASURY_ROLE) {
        require(guildId < 5, "WN: Invalid guild");
        guilds[guildId].active = active;
    }

    // ─── View Functions ──────────────────────────────────────────────
    function getGuildTradeLogCount(uint256 guildId) external view returns (uint256) {
        return guildTradeLogs[guildId].length;
    }

    function getGuildTradeLog(uint256 guildId, uint256 index) external view returns (TradeLog memory) {
        return guildTradeLogs[guildId][index];
    }

    function getSolarExportCount() external view returns (uint256) {
        return solarExports.length;
    }

    function getWillstoneStatus() external pure returns (uint256 anchor, string memory status) {
        return (WILLSTONE_ANCHOR, "SOVEREIGN_ACTIVE");
    }

    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    // ─── Admin ───────────────────────────────────────────────────────
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    function setTreasury(address newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(TREASURY_ROLE, treasury);
        treasury = newTreasury;
        _grantRole(TREASURY_ROLE, newTreasury);
    }

    function setL1BedrockBridge(address newBridge) external onlyRole(DEFAULT_ADMIN_ROLE) {
        l1BedrockBridge = newBridge;
    }

    receive() external payable {
        totalBridgedFromL1 += msg.value;
        emit BridgeDeposit(msg.sender, msg.value, msg.value);
    }
}
