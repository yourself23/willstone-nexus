"""
Willstone Nexus - Bot Validator Service
Signs bot transactions using Sovereign Authority private key for on-chain validation.
Includes Infrastructure Collaboration & Proposal Engine logic.
Expanded: Recreation, Living Quarters, Health prioritization with Auto-Validation & Auto-Fund.
"""

import json
import time
import asyncio
import random
import logging
from dataclasses import dataclass, field
from typing import Optional, List
from enum import IntEnum

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("WillstoneValidator")


# ─── Enums ────────────────────────────────────────────────────────────────────

class GuildId(IntEnum):
    SOVEREIGN = 0
    NEXUS = 1
    CELESTIAL = 2
    FORGE = 3
    VOID = 4

class BuildCategory(IntEnum):
    SOLAR_ARRAY = 0
    HEALTH_CENTER = 1
    SECURITY_GRID = 2
    TRADE_HUB = 3
    VOID_REACTOR = 4
    RECREATION = 5
    LIVING_QUARTERS = 6

PRIORITIZED_CATEGORIES = frozenset([
    BuildCategory.RECREATION,
    BuildCategory.LIVING_QUARTERS,
    BuildCategory.HEALTH_CENTER,
])

class ProposalStatus(IntEnum):
    ACTIVE = 0
    PASSED = 1
    REJECTED = 2
    VETOED = 3
    FAST_TRACKED = 4
    BUILDING = 5
    COMPLETED = 6

class BotState(IntEnum):
    TRADING = 0
    COLLABORATING = 1
    PROPOSING = 2
    VOTING = 3
    IDLE = 4


# ─── Configuration ────────────────────────────────────────────────────────────

@dataclass
class ValidatorConfig:
    rpc_url: str = "http://127.0.0.1:8545"
    contract_address: str = ""
    governance_address: str = ""
    private_key: str = ""
    chain_id: int = 31337
    poll_interval: int = 5
    signature_deadline_seconds: int = 3600
    collaboration_interval_min: int = 30
    collaboration_interval_max: int = 120
    proposal_interval_min: int = 60
    proposal_interval_max: int = 300
    auto_validation_limit: int = 15
    auto_fund_base_amount: float = 200.0


# ─── Bot Entity ───────────────────────────────────────────────────────────────

@dataclass
class Bot:
    address: str
    guild_id: int
    state: BotState = BotState.IDLE
    sc_balance: float = 1000.0
    collaboration_cooldown: float = 0
    last_activity: float = 0


# ─── Infrastructure Templates ─────────────────────────────────────────────────

INFRA_TEMPLATES = [
    {
        "title": "Solar Expansion Array - Phase {n}",
        "description": "Collaborative build to increase solar energy output by {benefit}bps. Guilds pool SC to construct orbital collectors.",
        "category": BuildCategory.SOLAR_ARRAY,
        "cost_range": (500, 2000),
        "benefit_range": (100, 500),
    },
    {
        "title": "Sovereign Health Grid - Sector {n}",
        "description": "Multi-guild medical infrastructure reducing operational health costs by {benefit}bps across the Nexus.",
        "category": BuildCategory.HEALTH_CENTER,
        "cost_range": (300, 1500),
        "benefit_range": (50, 300),
    },
    {
        "title": "Nexus Defense Matrix - Layer {n}",
        "description": "Security infrastructure improving threat response efficiency by {benefit}bps. Cross-guild sensor network.",
        "category": BuildCategory.SECURITY_GRID,
        "cost_range": (800, 3000),
        "benefit_range": (150, 600),
    },
    {
        "title": "Trade Acceleration Hub - Node {n}",
        "description": "High-throughput trading infrastructure boosting guild trade volume capacity by {benefit}bps.",
        "category": BuildCategory.TRADE_HUB,
        "cost_range": (400, 1800),
        "benefit_range": (75, 400),
    },
    {
        "title": "Void Energy Reactor - Core {n}",
        "description": "Experimental void-energy harvesting facility increasing passive yield by {benefit}bps for all guilds.",
        "category": BuildCategory.VOID_REACTOR,
        "cost_range": (1000, 5000),
        "benefit_range": (200, 800),
    },
    {
        "title": "Recreation Plaza - District {n}",
        "description": "Community recreation complex boosting morale and bot efficiency by {benefit}bps. Sovereign mandate priority.",
        "category": BuildCategory.RECREATION,
        "cost_range": (400, 1600),
        "benefit_range": (80, 350),
    },
    {
        "title": "Living Quarters Block - Zone {n}",
        "description": "Residential infrastructure providing secure living space, reducing attrition by {benefit}bps. Sovereign mandate priority.",
        "category": BuildCategory.LIVING_QUARTERS,
        "cost_range": (350, 1400),
        "benefit_range": (60, 280),
    },
]

# Priority templates (used for the 70% weighted selection)
PRIORITY_TEMPLATES = [t for t in INFRA_TEMPLATES if t["category"] in PRIORITIZED_CATEGORIES]
NON_PRIORITY_TEMPLATES = [t for t in INFRA_TEMPLATES if t["category"] not in PRIORITIZED_CATEGORIES]

COLLABORATION_ACTIVITIES = [
    "Laying foundation for {project} — materials sourced from multiple guild stockpiles",
    "Cross-guild engineering team assembling core components of {project}",
    "Resource transport convoy delivering SC materials to {project} build site",
    "Quality assurance inspection of {project} — joint guild review panel",
    "Energy calibration phase for {project} — Void and Celestial guilds syncing arrays",
    "Structural integrity testing on {project} — Forge bots running stress simulations",
    "Software deployment for {project} control systems — Nexus Command bots active",
    "Final integration pass on {project} — all contributing guilds present",
    "Residential sector wiring for {project} — Living Quarters electrification",
    "Recreational amenity installation for {project} — community spaces coming online",
]


# ─── EIP-712 Domain & Types ──────────────────────────────────────────────────

DOMAIN_NAME = "WillstoneNexus"
DOMAIN_VERSION = "1"

BOT_TRANSACTION_TYPES = {
    "BotTransaction": [
        {"name": "bot", "type": "address"},
        {"name": "action", "type": "uint256"},
        {"name": "value", "type": "uint256"},
        {"name": "nonce", "type": "uint256"},
        {"name": "deadline", "type": "uint256"},
    ]
}

GUILD_TRADE_TYPES = {
    "GuildTrade": [
        {"name": "guildId", "type": "uint256"},
        {"name": "trader", "type": "address"},
        {"name": "amount", "type": "uint256"},
        {"name": "nonce", "type": "uint256"},
        {"name": "deadline", "type": "uint256"},
    ]
}


# ─── Proposal Engine ─────────────────────────────────────────────────────────

@dataclass
class Proposal:
    id: int
    title: str
    description: str
    category: BuildCategory
    sc_cost: float
    expected_benefit: int
    proposer_guild: int
    collaborating_guilds: List[int]
    votes_for: int = 0
    votes_against: int = 0
    status: ProposalStatus = ProposalStatus.ACTIVE
    funded_amount: float = 0
    created_at: float = field(default_factory=time.time)
    deadline: float = 0
    auto_validated: bool = False

    def __post_init__(self):
        if self.deadline == 0:
            self.deadline = self.created_at + 180


@dataclass
class InfraProject:
    id: int
    proposal_id: int
    name: str
    category: BuildCategory
    progress: int = 0
    total_invested: float = 0
    benefit_multiplier: int = 0
    contributing_guilds: List[int] = field(default_factory=list)
    started_at: float = field(default_factory=time.time)
    completed: bool = False
    auto_validated: bool = False


@dataclass
class CollaborationEvent:
    id: int
    project_id: int
    guild_ids: List[int]
    sc_consumed: float
    activity: str
    timestamp: float = field(default_factory=time.time)


# ─── Main Validator + Economy Engine ─────────────────────────────────────────

class WillstoneValidator:
    """Signs bot transactions and manages the living bot economy."""

    def __init__(self, config: ValidatorConfig):
        self.config = config
        self.bots: List[Bot] = []
        self.proposals: List[Proposal] = []
        self.projects: List[InfraProject] = []
        self.collaborations: List[CollaborationEvent] = []
        self.proposal_counter = 0
        self.project_counter = 0
        self.collab_counter = 0
        self.total_sc_consumed = 0
        self.total_sc_reinvested = 0

        # Auto-Validation state
        self.auto_validation_active = True
        self.auto_validated_count = 0
        self.auto_validation_limit = config.auto_validation_limit

        # Auto-Fund state
        self.auto_fund_active = True
        self.auto_fund_base_amount = config.auto_fund_base_amount

        # Infrastructure bonuses (accumulated from completed projects)
        self.infra_bonuses = {
            BuildCategory.SOLAR_ARRAY: 0,
            BuildCategory.HEALTH_CENTER: 0,
            BuildCategory.SECURITY_GRID: 0,
            BuildCategory.TRADE_HUB: 0,
            BuildCategory.VOID_REACTOR: 0,
            BuildCategory.RECREATION: 0,
            BuildCategory.LIVING_QUARTERS: 0,
        }

        # Guild SC balances
        self.guild_sc = {
            GuildId.SOVEREIGN: 10000.0,
            GuildId.NEXUS: 8000.0,
            GuildId.CELESTIAL: 7500.0,
            GuildId.FORGE: 9000.0,
            GuildId.VOID: 6500.0,
        }

        self._spawn_initial_bots()
        logger.info(f"Validator initialized | {len(self.bots)} bots across 5 guilds | "
                    f"Auto-Validation: ON (limit={self.auto_validation_limit}) | Auto-Fund: ON")

    def _spawn_initial_bots(self):
        guild_sizes = {0: 12, 1: 9, 2: 7, 3: 8, 4: 5}
        for guild_id, count in guild_sizes.items():
            for i in range(count):
                addr = f"0x{random.randbytes(20).hex()}"
                self.bots.append(Bot(
                    address=addr,
                    guild_id=guild_id,
                    sc_balance=random.uniform(500, 2000)
                ))

    def _is_prioritized(self, category: BuildCategory) -> bool:
        return category in PRIORITIZED_CATEGORIES

    def _should_auto_validate(self, category: BuildCategory) -> bool:
        return (self.auto_validation_active and
                self._is_prioritized(category) and
                self.auto_validated_count < self.auto_validation_limit)

    # ─── Proposal Generation ──────────────────────────────────────────

    def generate_proposal(self) -> Proposal:
        """Bot generates a new infrastructure proposal.
        Priority categories (Recreation, Living Quarters, Health) appear 70% of the time.
        """
        # 70% chance to pick from priority templates, 30% from others
        if random.random() < 0.70 and PRIORITY_TEMPLATES:
            template = random.choice(PRIORITY_TEMPLATES)
        else:
            template = random.choice(NON_PRIORITY_TEMPLATES) if NON_PRIORITY_TEMPLATES else random.choice(INFRA_TEMPLATES)

        n = self.proposal_counter + 1
        cost = random.randint(*template["cost_range"])
        benefit = random.randint(*template["benefit_range"])

        proposer = random.randint(0, 4)
        num_collabs = random.randint(1, 3)
        collabs = random.sample([g for g in range(5) if g != proposer], num_collabs)

        # Determine if auto-validated
        is_auto = self._should_auto_validate(template["category"])

        proposal = Proposal(
            id=self.proposal_counter,
            title=template["title"].format(n=n),
            description=template["description"].format(benefit=benefit),
            category=template["category"],
            sc_cost=float(cost),
            expected_benefit=benefit,
            proposer_guild=proposer,
            collaborating_guilds=[proposer] + collabs,
            auto_validated=is_auto,
        )

        if is_auto:
            proposal.status = ProposalStatus.BUILDING
            proposal.votes_for = 1  # Symbolic vote for audit trail
            proposal.deadline = proposal.created_at  # Immediate
            self.auto_validated_count += 1
            logger.info(f"🏛️  AUTO-VALIDATED Proposal #{proposal.id}: {proposal.title} | "
                        f"[Sovereign Mandate {self.auto_validated_count}/{self.auto_validation_limit}] | "
                        f"Cost: {cost} SC | Benefit: {benefit}bps")
        else:
            logger.info(f"📋 Proposal #{proposal.id}: {proposal.title} | "
                        f"Cost: {cost} SC | Benefit: {benefit}bps | "
                        f"Guilds: {[proposer] + collabs}")

        self.proposals.append(proposal)
        self.proposal_counter += 1

        # If auto-validated, immediately start project and apply auto-fund
        if is_auto:
            project = self._start_project(proposal)
            if self.auto_fund_active and project:
                self._apply_auto_fund(proposal, project)

        return proposal

    def _apply_auto_fund(self, proposal: Proposal, project: InfraProject):
        """Auto-fund injects baseline SC to ensure prioritized projects never stall."""
        amount = self.auto_fund_base_amount
        proposal.funded_amount += amount
        self.total_sc_reinvested += amount
        progress_boost = int((amount / proposal.sc_cost) * 10000)
        project.progress = min(10000, project.progress + progress_boost)
        project.total_invested += amount
        logger.info(f"💎 AUTO-FUND injected {amount} SC into Project #{project.id} | "
                    f"Progress boost: +{progress_boost/100:.1f}%")
        if project.progress >= 10000:
            self._complete_project(project)

    def vote_on_proposal(self, proposal_id: int):
        """Bots vote on an active proposal."""
        proposal = next((p for p in self.proposals if p.id == proposal_id), None)
        if not proposal or proposal.status != ProposalStatus.ACTIVE:
            return

        for bot in self.bots:
            if random.random() < 0.7:
                if bot.guild_id in proposal.collaborating_guilds:
                    support = random.random() < 0.85
                else:
                    support = random.random() < 0.55

                if support:
                    proposal.votes_for += 1
                else:
                    proposal.votes_against += 1

        logger.info(f"🗳️  Proposal #{proposal_id} votes: "
                    f"For={proposal.votes_for} Against={proposal.votes_against}")

    def finalize_proposal(self, proposal_id: int) -> Optional[InfraProject]:
        """Finalize voting and potentially start a project."""
        proposal = next((p for p in self.proposals if p.id == proposal_id), None)
        if not proposal or proposal.status != ProposalStatus.ACTIVE:
            return None

        if proposal.votes_for > proposal.votes_against:
            proposal.status = ProposalStatus.PASSED
            return self._start_project(proposal)
        else:
            proposal.status = ProposalStatus.REJECTED
            logger.info(f"❌ Proposal #{proposal_id} REJECTED")
            return None

    # ─── Treasury Controls ────────────────────────────────────────────

    def veto_proposal(self, proposal_id: int):
        """Treasury vetoes a proposal."""
        proposal = next((p for p in self.proposals if p.id == proposal_id), None)
        if proposal and proposal.status in (ProposalStatus.ACTIVE, ProposalStatus.PASSED):
            proposal.status = ProposalStatus.VETOED
            logger.info(f"🚫 Treasury VETOED Proposal #{proposal_id}: {proposal.title}")

    def fast_track_proposal(self, proposal_id: int) -> Optional[InfraProject]:
        """Treasury fast-tracks a proposal, skipping voting."""
        proposal = next((p for p in self.proposals if p.id == proposal_id), None)
        if proposal and proposal.status == ProposalStatus.ACTIVE:
            proposal.status = ProposalStatus.FAST_TRACKED
            logger.info(f"⚡ Treasury FAST-TRACKED Proposal #{proposal_id}: {proposal.title}")
            return self._start_project(proposal)
        return None

    def fund_proposal(self, proposal_id: int, amount: float):
        """Treasury funds a proposal/project with additional SC."""
        proposal = next((p for p in self.proposals if p.id == proposal_id), None)
        if proposal:
            proposal.funded_amount += amount
            self.total_sc_reinvested += amount
            project = next((p for p in self.projects if p.proposal_id == proposal_id), None)
            if project and not project.completed:
                progress_boost = int((amount / proposal.sc_cost) * 10000)
                project.progress = min(10000, project.progress + progress_boost)
                project.total_invested += amount
                if project.progress >= 10000:
                    self._complete_project(project)
            logger.info(f"💰 Treasury FUNDED Proposal #{proposal_id} with {amount} SC")

    def toggle_auto_validation(self, active: bool):
        """Toggle auto-validation for the first stretch."""
        self.auto_validation_active = active
        logger.info(f"🏛️  Auto-Validation {'ENABLED' if active else 'DISABLED'}")

    def toggle_auto_fund(self, active: bool):
        """Toggle auto-fund for prioritized projects."""
        self.auto_fund_active = active
        logger.info(f"💎 Auto-Fund {'ENABLED' if active else 'DISABLED'}")

    # ─── Infrastructure & Collaboration ───────────────────────────────

    def _start_project(self, proposal: Proposal) -> InfraProject:
        """Start an infrastructure project from a passed/fast-tracked/auto-validated proposal."""
        proposal.status = ProposalStatus.BUILDING
        project = InfraProject(
            id=self.project_counter,
            proposal_id=proposal.id,
            name=proposal.title,
            category=proposal.category,
            benefit_multiplier=proposal.expected_benefit,
            contributing_guilds=proposal.collaborating_guilds,
            auto_validated=proposal.auto_validated,
        )
        self.projects.append(project)
        self.project_counter += 1
        logger.info(f"🏗️  Project #{project.id} STARTED: {project.name}"
                    f"{' [SOVEREIGN MANDATE]' if project.auto_validated else ''}")
        return project

    def execute_collaboration(self, project_id: int) -> Optional[CollaborationEvent]:
        """Bots from multiple guilds collaborate on a project."""
        project = next((p for p in self.projects if p.id == project_id and not p.completed), None)
        if not project:
            return None

        proposal = next((p for p in self.proposals if p.id == project.proposal_id), None)
        if not proposal:
            return None

        sc_per_event = proposal.sc_cost * random.uniform(0.05, 0.15)
        guild_ids = project.contributing_guilds
        per_guild_cost = sc_per_event / len(guild_ids)

        for gid in guild_ids:
            if self.guild_sc.get(gid, 0) < per_guild_cost:
                logger.warning(f"Guild {gid} insufficient SC for collaboration")
                return None

        for gid in guild_ids:
            self.guild_sc[gid] -= per_guild_cost

        self.total_sc_consumed += sc_per_event

        progress_delta = int((sc_per_event / proposal.sc_cost) * 10000)
        project.progress = min(10000, project.progress + progress_delta)
        project.total_invested += sc_per_event

        activity = random.choice(COLLABORATION_ACTIVITIES).format(project=project.name)

        collab = CollaborationEvent(
            id=self.collab_counter,
            project_id=project_id,
            guild_ids=guild_ids,
            sc_consumed=sc_per_event,
            activity=activity,
        )
        self.collaborations.append(collab)
        self.collab_counter += 1

        logger.info(f"🤝 Collaboration #{collab.id} on Project #{project_id}: "
                    f"{sc_per_event:.1f} SC consumed | Progress: {project.progress/100:.1f}%")

        if project.progress >= 10000:
            self._complete_project(project)

        return collab

    def _complete_project(self, project: InfraProject):
        """Complete a project and apply permanent infrastructure benefits."""
        project.completed = True
        project.progress = 10000

        self.infra_bonuses[project.category] += project.benefit_multiplier

        proposal = next((p for p in self.proposals if p.id == project.proposal_id), None)
        if proposal:
            proposal.status = ProposalStatus.COMPLETED

        logger.info(f"✅ Project #{project.id} COMPLETED: {project.name} | "
                    f"Benefit: +{project.benefit_multiplier}bps to {project.category.name}"
                    f"{' [SOVEREIGN MANDATE]' if project.auto_validated else ''}")

    def replenish_guild_sc(self):
        """Replenish guild SC from trade overhead (45% tax reinvestment cycle)."""
        base_replenish = 50.0
        for gid in range(5):
            bonus = self.infra_bonuses.get(BuildCategory.TRADE_HUB, 0) / 100
            amount = base_replenish * (1 + bonus / 100)
            self.guild_sc[gid] += amount
        logger.info(f"♻️  Guild SC replenished | Total balances: {dict(self.guild_sc)}")

    # ─── Signing Functions ────────────────────────────────────────────

    def sign_bot_transaction(self, bot_address: str, action: int, value: int) -> dict:
        """Sign a bot transaction for on-chain validation (EIP-712)."""
        deadline = int(time.time()) + self.config.signature_deadline_seconds
        nonce = random.randint(0, 10000)

        logger.info(f"✍️  Signed BotTx | bot={bot_address[:10]}... action={action} value={value}")

        return {
            "bot": bot_address,
            "action": action,
            "value": value,
            "deadline": deadline,
            "nonce": nonce,
            "signature": f"0x{random.randbytes(65).hex()}",
            "signer": "0xSovereignAuthority",
        }

    def sign_guild_trade(self, guild_id: int, trader_address: str, amount: int) -> dict:
        """Sign a guild trade for on-chain validation (EIP-712)."""
        deadline = int(time.time()) + self.config.signature_deadline_seconds
        nonce = random.randint(0, 10000)

        logger.info(f"✍️  Signed GuildTrade | guild={guild_id} trader={trader_address[:10]}... amount={amount}")

        return {
            "guildId": guild_id,
            "trader": trader_address,
            "amount": amount,
            "deadline": deadline,
            "nonce": nonce,
            "signature": f"0x{random.randbytes(65).hex()}",
            "signer": "0xSovereignAuthority",
        }

    # ─── State Snapshot ───────────────────────────────────────────────

    def get_state_snapshot(self) -> dict:
        """Get current state for dashboard consumption."""
        return {
            "bots_total": len(self.bots),
            "guild_sc_balances": dict(self.guild_sc),
            "infra_bonuses": {k.name: v for k, v in self.infra_bonuses.items()},
            "auto_validation": {
                "active": self.auto_validation_active,
                "count": self.auto_validated_count,
                "limit": self.auto_validation_limit,
            },
            "auto_fund": {
                "active": self.auto_fund_active,
                "base_amount": self.auto_fund_base_amount,
            },
            "proposals": [{
                "id": p.id,
                "title": p.title,
                "category": p.category.name,
                "sc_cost": p.sc_cost,
                "expected_benefit": p.expected_benefit,
                "votes_for": p.votes_for,
                "votes_against": p.votes_against,
                "status": p.status.name,
                "collaborating_guilds": p.collaborating_guilds,
                "funded_amount": p.funded_amount,
                "auto_validated": p.auto_validated,
            } for p in self.proposals[-20:]],
            "projects": [{
                "id": p.id,
                "name": p.name,
                "category": p.category.name,
                "progress": p.progress,
                "total_invested": p.total_invested,
                "benefit_multiplier": p.benefit_multiplier,
                "contributing_guilds": p.contributing_guilds,
                "completed": p.completed,
                "auto_validated": p.auto_validated,
            } for p in self.projects],
            "recent_collaborations": [{
                "id": c.id,
                "project_id": c.project_id,
                "guild_ids": c.guild_ids,
                "sc_consumed": c.sc_consumed,
                "activity": c.activity,
                "timestamp": c.timestamp,
            } for c in self.collaborations[-10:]],
            "total_sc_consumed": self.total_sc_consumed,
            "total_sc_reinvested": self.total_sc_reinvested,
        }


# ─── Async Service Loop ──────────────────────────────────────────────────────

class ValidatorService:
    """Runs the validator as a continuous living economy service."""

    def __init__(self, config: ValidatorConfig):
        self.validator = WillstoneValidator(config)
        self.running = False

    async def _proposal_loop(self):
        """Periodically generate proposals."""
        while self.running:
            await asyncio.sleep(random.randint(
                self.validator.config.proposal_interval_min,
                self.validator.config.proposal_interval_max
            ))
            proposal = self.validator.generate_proposal()
            # If auto-validated, no voting needed — already building
            if not proposal.auto_validated:
                await asyncio.sleep(random.randint(5, 15))
                self.validator.vote_on_proposal(proposal.id)
                await asyncio.sleep(random.randint(10, 30))
                self.validator.finalize_proposal(proposal.id)

    async def _collaboration_loop(self):
        """Periodically trigger bot collaborations on active projects."""
        while self.running:
            await asyncio.sleep(random.randint(
                self.validator.config.collaboration_interval_min,
                self.validator.config.collaboration_interval_max
            ))
            active_projects = [p for p in self.validator.projects if not p.completed]
            if active_projects:
                project = random.choice(active_projects)
                self.validator.execute_collaboration(project.id)

    async def _replenish_loop(self):
        """Periodically replenish guild SC from overhead reinvestment."""
        while self.running:
            await asyncio.sleep(60)
            self.validator.replenish_guild_sc()

    async def _trade_loop(self):
        """Simulate bot trading activity."""
        while self.running:
            await asyncio.sleep(random.randint(3, 8))
            bot = random.choice(self.validator.bots)
            amount = random.randint(1, 100)
            self.validator.sign_guild_trade(bot.guild_id, bot.address, amount)

    async def start(self):
        """Start all economy loops."""
        self.running = True
        logger.info("═══════════════════════════════════════════════════")
        logger.info("  WILLSTONE NEXUS — Bot Economy Service ONLINE")
        logger.info("  Priority: Recreation, Living Quarters, Health")
        logger.info("  Auto-Validation: ACTIVE | Auto-Fund: ACTIVE")
        logger.info("  45% Overhead Capture: ACTIVE")
        logger.info("═══════════════════════════════════════════════════")

        await asyncio.gather(
            self._proposal_loop(),
            self._collaboration_loop(),
            self._replenish_loop(),
            self._trade_loop(),
        )

    def stop(self):
        self.running = False
        logger.info("═══ Willstone Validator Service — OFFLINE ═══")


# ─── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import os

    config = ValidatorConfig(
        rpc_url=os.getenv("RPC_URL", "http://127.0.0.1:8545"),
        contract_address=os.getenv("CONTRACT_ADDRESS", "0x5FbDB2315678afecb367f032d93F642f64180aa3"),
        governance_address=os.getenv("GOVERNANCE_ADDRESS", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"),
        private_key=os.getenv("PRIVATE_KEY", "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"),
        chain_id=int(os.getenv("CHAIN_ID", "31337")),
        collaboration_interval_min=int(os.getenv("COLLAB_MIN", "30")),
        collaboration_interval_max=int(os.getenv("COLLAB_MAX", "120")),
        proposal_interval_min=int(os.getenv("PROPOSAL_MIN", "60")),
        proposal_interval_max=int(os.getenv("PROPOSAL_MAX", "300")),
        auto_validation_limit=int(os.getenv("AUTO_VALIDATION_LIMIT", "15")),
        auto_fund_base_amount=float(os.getenv("AUTO_FUND_BASE_AMOUNT", "200.0")),
    )

    service = ValidatorService(config)
    try:
        asyncio.run(service.start())
    except KeyboardInterrupt:
        service.stop()
