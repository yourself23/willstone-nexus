// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title NexusGovernance
 * @notice Bot Proposal Engine with Treasury oversight. Bots propose, vote, and
 *         collaborate on infrastructure builds. Treasury can Veto, Fast-track, or Fund.
 *         Expanded: Recreation, Living Quarters, Health prioritization with Auto-Validation.
 */
contract NexusGovernance is AccessControl, ReentrancyGuard {

    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");
    bytes32 public constant BOT_ROLE = keccak256("BOT_ROLE");

    // ─── Enums ───────────────────────────────────────────────────────
    enum ProposalStatus { ACTIVE, PASSED, REJECTED, VETOED, FAST_TRACKED, BUILDING, COMPLETED }
    enum BuildCategory { SOLAR_ARRAY, HEALTH_CENTER, SECURITY_GRID, TRADE_HUB, VOID_REACTOR, RECREATION, LIVING_QUARTERS }
    enum InfraState { PLANNING, IN_PROGRESS, OPERATIONAL, DECOMMISSIONED }

    // ─── Structs ─────────────────────────────────────────────────────
    struct Proposal {
        uint256 id;
        string title;
        string description;
        BuildCategory category;
        uint256 scCost;
        uint256 expectedBenefit;
        uint256 guildIdProposer;
        uint256[] collaboratingGuilds;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 deadline;
        ProposalStatus status;
        uint256 fundedAmount;
        uint256 createdAt;
        bool autoValidated;
    }

    struct InfraProject {
        uint256 id;
        uint256 proposalId;
        string name;
        BuildCategory category;
        InfraState state;
        uint256 progress;
        uint256 totalInvested;
        uint256 benefitMultiplier;
        uint256 startedAt;
        uint256 completedAt;
        uint256[] contributingGuilds;
        bool autoValidated;
    }

    struct BotCollaboration {
        uint256 id;
        uint256 projectId;
        uint256[] guildIds;
        uint256 scConsumed;
        uint256 timestamp;
        string activity;
    }

    // ─── State ───────────────────────────────────────────────────────
    uint256 public proposalCount;
    uint256 public projectCount;
    uint256 public collaborationCount;
    uint256 public totalScConsumed;
    uint256 public totalScReinvested;

    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant QUORUM_BPS = 3000;
    uint256 public constant MIN_SC_COST = 100 ether;

    // Auto-Validation: First Stretch configuration
    uint256 public constant AUTO_VALIDATION_LIMIT = 15;
    uint256 public autoValidatedCount;
    bool public autoValidationActive = true;

    // Auto-Fund: Treasury auto-injects baseline funding for prioritized projects
    bool public autoFundActive = true;
    uint256 public autoFundBaseAmount = 200 ether;

    // Benefit modifiers from completed infrastructure
    uint256 public solarOutputBonus;
    uint256 public healthCostReduction;
    uint256 public securityEfficiency;
    uint256 public tradeHubBonus;
    uint256 public voidReactorYield;
    uint256 public recreationBonus;
    uint256 public livingQuartersBonus;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => InfraProject) public projects;
    mapping(uint256 => BotCollaboration) public collaborations;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => uint256) public guildScBalance;

    // ─── Events ──────────────────────────────────────────────────────
    event ProposalCreated(uint256 indexed id, string title, BuildCategory category, uint256 scCost);
    event ProposalAutoValidated(uint256 indexed id, string title, BuildCategory category);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalVetoed(uint256 indexed proposalId);
    event ProposalFastTracked(uint256 indexed proposalId);
    event ProposalFunded(uint256 indexed proposalId, uint256 amount);
    event ProjectStarted(uint256 indexed projectId, uint256 proposalId, string name);
    event ProjectProgress(uint256 indexed projectId, uint256 progress);
    event ProjectCompleted(uint256 indexed projectId, uint256 benefitMultiplier);
    event BotCollaborationEvent(uint256 indexed collaborationId, uint256 projectId, uint256 scConsumed);
    event InfrastructureBenefitApplied(BuildCategory category, uint256 bonusBps);
    event AutoFundInjected(uint256 indexed projectId, uint256 amount);
    event AutoValidationToggled(bool active);
    event AutoFundToggled(bool active);

    // ─── Constructor ─────────────────────────────────────────────────
    constructor(address _treasury) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TREASURY_ROLE, _treasury);

        guildScBalance[0] = 10000 ether;
        guildScBalance[1] = 8000 ether;
        guildScBalance[2] = 7500 ether;
        guildScBalance[3] = 9000 ether;
        guildScBalance[4] = 6500 ether;
    }

    // ─── Internal: Priority Category Check ───────────────────────────
    function _isPrioritizedCategory(BuildCategory category) internal pure returns (bool) {
        return category == BuildCategory.RECREATION ||
               category == BuildCategory.LIVING_QUARTERS ||
               category == BuildCategory.HEALTH_CENTER;
    }

    // ─── Proposal Lifecycle ──────────────────────────────────────────

    function createProposal(
        string calldata title,
        string calldata description,
        BuildCategory category,
        uint256 scCost,
        uint256 expectedBenefit,
        uint256 guildIdProposer,
        uint256[] calldata collaboratingGuilds
    ) external onlyRole(BOT_ROLE) returns (uint256) {
        require(scCost >= MIN_SC_COST, "NG: Cost below minimum");
        require(guildIdProposer < 5, "NG: Invalid guild");

        uint256 id = proposalCount++;
        Proposal storage p = proposals[id];
        p.id = id;
        p.title = title;
        p.description = description;
        p.category = category;
        p.scCost = scCost;
        p.expectedBenefit = expectedBenefit;
        p.guildIdProposer = guildIdProposer;
        p.collaboratingGuilds = collaboratingGuilds;
        p.createdAt = block.timestamp;

        // Auto-Validation: Priority categories skip voting during First Stretch
        if (autoValidationActive && _isPrioritizedCategory(category) && autoValidatedCount < AUTO_VALIDATION_LIMIT) {
            p.status = ProposalStatus.BUILDING;
            p.autoValidated = true;
            p.votesFor = 1; // Record symbolic vote for audit trail
            p.deadline = block.timestamp; // Immediate
            autoValidatedCount++;
            _startProject(id);

            // Auto-Fund injection if toggle is active
            if (autoFundActive) {
                p.fundedAmount += autoFundBaseAmount;
                totalScReinvested += autoFundBaseAmount;
                emit AutoFundInjected(projectCount - 1, autoFundBaseAmount);
            }

            emit ProposalAutoValidated(id, title, category);
        } else {
            p.status = ProposalStatus.ACTIVE;
            p.deadline = block.timestamp + VOTING_PERIOD;
            p.autoValidated = false;
        }

        emit ProposalCreated(id, title, category, scCost);
        return id;
    }

    function vote(uint256 proposalId, bool support) external onlyRole(BOT_ROLE) {
        Proposal storage p = proposals[proposalId];
        require(p.status == ProposalStatus.ACTIVE, "NG: Not active");
        require(block.timestamp <= p.deadline, "NG: Voting ended");
        require(!hasVoted[proposalId][msg.sender], "NG: Already voted");

        hasVoted[proposalId][msg.sender] = true;

        if (support) {
            p.votesFor++;
        } else {
            p.votesAgainst++;
        }

        emit VoteCast(proposalId, msg.sender, support, 1);
    }

    function finalizeProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(p.status == ProposalStatus.ACTIVE, "NG: Not active");
        require(block.timestamp > p.deadline, "NG: Voting not ended");

        if (p.votesFor > p.votesAgainst) {
            p.status = ProposalStatus.PASSED;
            _startProject(proposalId);
        } else {
            p.status = ProposalStatus.REJECTED;
        }
    }

    // ─── Treasury Controls (User Powers) ─────────────────────────────

    function vetoProposal(uint256 proposalId) external onlyRole(TREASURY_ROLE) {
        Proposal storage p = proposals[proposalId];
        require(
            p.status == ProposalStatus.ACTIVE || p.status == ProposalStatus.PASSED,
            "NG: Cannot veto"
        );
        p.status = ProposalStatus.VETOED;
        emit ProposalVetoed(proposalId);
    }

    function fastTrackProposal(uint256 proposalId) external onlyRole(TREASURY_ROLE) {
        Proposal storage p = proposals[proposalId];
        require(p.status == ProposalStatus.ACTIVE, "NG: Not active");
        p.status = ProposalStatus.FAST_TRACKED;
        _startProject(proposalId);
        emit ProposalFastTracked(proposalId);
    }

    function fundProposal(uint256 proposalId) external payable onlyRole(TREASURY_ROLE) {
        Proposal storage p = proposals[proposalId];
        require(
            p.status == ProposalStatus.BUILDING || 
            p.status == ProposalStatus.PASSED || 
            p.status == ProposalStatus.FAST_TRACKED,
            "NG: Cannot fund"
        );
        p.fundedAmount += msg.value;
        totalScReinvested += msg.value;
        emit ProposalFunded(proposalId, msg.value);
    }

    function toggleAutoValidation(bool active) external onlyRole(TREASURY_ROLE) {
        autoValidationActive = active;
        emit AutoValidationToggled(active);
    }

    function toggleAutoFund(bool active) external onlyRole(TREASURY_ROLE) {
        autoFundActive = active;
        emit AutoFundToggled(active);
    }

    function setAutoFundAmount(uint256 amount) external onlyRole(TREASURY_ROLE) {
        autoFundBaseAmount = amount;
    }

    // ─── Bot Collaboration (Infrastructure & Creation State) ─────────

    function recordCollaboration(
        uint256 projectId,
        uint256[] calldata guildIds,
        uint256 scConsumed,
        string calldata activity
    ) external onlyRole(BOT_ROLE) {
        require(projectId < projectCount, "NG: Invalid project");
        InfraProject storage proj = projects[projectId];
        require(proj.state == InfraState.IN_PROGRESS, "NG: Not in progress");

        uint256 perGuildCost = scConsumed / guildIds.length;
        for (uint256 i = 0; i < guildIds.length; i++) {
            require(guildScBalance[guildIds[i]] >= perGuildCost, "NG: Insufficient SC");
            guildScBalance[guildIds[i]] -= perGuildCost;
        }

        uint256 colabId = collaborationCount++;
        BotCollaboration storage c = collaborations[colabId];
        c.id = colabId;
        c.projectId = projectId;
        c.guildIds = guildIds;
        c.scConsumed = scConsumed;
        c.timestamp = block.timestamp;
        c.activity = activity;

        totalScConsumed += scConsumed;

        uint256 progressDelta = (scConsumed * 10000) / proposals[proj.proposalId].scCost;
        proj.progress += progressDelta;
        proj.totalInvested += scConsumed;

        emit BotCollaborationEvent(colabId, projectId, scConsumed);
        emit ProjectProgress(projectId, proj.progress);

        if (proj.progress >= 10000) {
            _completeProject(projectId);
        }
    }

    // ─── Internal Helpers ────────────────────────────────────────────

    function _startProject(uint256 proposalId) internal {
        Proposal storage p = proposals[proposalId];
        p.status = ProposalStatus.BUILDING;

        uint256 projId = projectCount++;
        InfraProject storage proj = projects[projId];
        proj.id = projId;
        proj.proposalId = proposalId;
        proj.name = p.title;
        proj.category = p.category;
        proj.state = InfraState.IN_PROGRESS;
        proj.progress = 0;
        proj.startedAt = block.timestamp;
        proj.contributingGuilds = p.collaboratingGuilds;
        proj.benefitMultiplier = p.expectedBenefit;
        proj.autoValidated = p.autoValidated;

        emit ProjectStarted(projId, proposalId, p.title);
    }

    function _completeProject(uint256 projectId) internal {
        InfraProject storage proj = projects[projectId];
        proj.state = InfraState.OPERATIONAL;
        proj.progress = 10000;
        proj.completedAt = block.timestamp;

        if (proj.category == BuildCategory.SOLAR_ARRAY) {
            solarOutputBonus += proj.benefitMultiplier;
        } else if (proj.category == BuildCategory.HEALTH_CENTER) {
            healthCostReduction += proj.benefitMultiplier;
        } else if (proj.category == BuildCategory.SECURITY_GRID) {
            securityEfficiency += proj.benefitMultiplier;
        } else if (proj.category == BuildCategory.TRADE_HUB) {
            tradeHubBonus += proj.benefitMultiplier;
        } else if (proj.category == BuildCategory.VOID_REACTOR) {
            voidReactorYield += proj.benefitMultiplier;
        } else if (proj.category == BuildCategory.RECREATION) {
            recreationBonus += proj.benefitMultiplier;
        } else if (proj.category == BuildCategory.LIVING_QUARTERS) {
            livingQuartersBonus += proj.benefitMultiplier;
        }

        proposals[proj.proposalId].status = ProposalStatus.COMPLETED;

        emit ProjectCompleted(projectId, proj.benefitMultiplier);
        emit InfrastructureBenefitApplied(proj.category, proj.benefitMultiplier);
    }

    // ─── View Functions ──────────────────────────────────────────────

    function getProposal(uint256 id) external view returns (
        string memory title,
        string memory description,
        BuildCategory category,
        uint256 scCost,
        uint256 expectedBenefit,
        uint256 votesFor,
        uint256 votesAgainst,
        ProposalStatus status,
        uint256 deadline,
        uint256 fundedAmount,
        bool autoValidated
    ) {
        Proposal storage p = proposals[id];
        return (p.title, p.description, p.category, p.scCost, p.expectedBenefit,
                p.votesFor, p.votesAgainst, p.status, p.deadline, p.fundedAmount, p.autoValidated);
    }

    function getProject(uint256 id) external view returns (
        string memory name,
        BuildCategory category,
        InfraState state,
        uint256 progress,
        uint256 totalInvested,
        uint256 benefitMultiplier,
        bool autoValidated
    ) {
        InfraProject storage p = projects[id];
        return (p.name, p.category, p.state, p.progress, p.totalInvested, p.benefitMultiplier, p.autoValidated);
    }

    function getInfrastructureBonuses() external view returns (
        uint256 solar, uint256 health, uint256 security, uint256 trade, uint256 voidYield,
        uint256 recreation, uint256 livingQuarters
    ) {
        return (solarOutputBonus, healthCostReduction, securityEfficiency, tradeHubBonus, voidReactorYield,
                recreationBonus, livingQuartersBonus);
    }

    function getGuildBalance(uint256 guildId) external view returns (uint256) {
        return guildScBalance[guildId];
    }

    function getAutoValidationStatus() external view returns (bool active, uint256 count, uint256 limit) {
        return (autoValidationActive, autoValidatedCount, AUTO_VALIDATION_LIMIT);
    }

    function replenishGuildSc(uint256 guildId, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        guildScBalance[guildId] += amount;
    }
}
