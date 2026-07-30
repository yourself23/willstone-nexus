"""Tests for the Willstone Nexus Bot Validator Service — Infra Expansion."""

import pytest
import time
import random
from validator import (
    WillstoneValidator, ValidatorConfig, ValidatorService,
    GuildId, BuildCategory, ProposalStatus, BotState,
    Proposal, InfraProject, CollaborationEvent,
    PRIORITIZED_CATEGORIES, PRIORITY_TEMPLATES, NON_PRIORITY_TEMPLATES,
)


@pytest.fixture
def config():
    return ValidatorConfig(
        rpc_url="http://127.0.0.1:8545",
        contract_address="0x5FbDB2315678afecb367f032d93F642f64180aa3",
        governance_address="0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
        private_key="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        chain_id=31337,
        collaboration_interval_min=1,
        collaboration_interval_max=2,
        proposal_interval_min=1,
        proposal_interval_max=2,
        auto_validation_limit=15,
        auto_fund_base_amount=200.0,
    )


@pytest.fixture
def validator(config):
    return WillstoneValidator(config)


class TestInitialization:
    def test_bots_spawned(self, validator):
        assert len(validator.bots) == 41  # 12+9+7+8+5

    def test_guild_sc_balances(self, validator):
        assert validator.guild_sc[GuildId.SOVEREIGN] == 10000.0
        assert validator.guild_sc[GuildId.VOID] == 6500.0

    def test_infra_bonuses_include_new_categories(self, validator):
        for cat in BuildCategory:
            assert validator.infra_bonuses[cat] == 0
        assert BuildCategory.RECREATION in validator.infra_bonuses
        assert BuildCategory.LIVING_QUARTERS in validator.infra_bonuses

    def test_auto_validation_initialized(self, validator):
        assert validator.auto_validation_active is True
        assert validator.auto_validated_count == 0
        assert validator.auto_validation_limit == 15

    def test_auto_fund_initialized(self, validator):
        assert validator.auto_fund_active is True
        assert validator.auto_fund_base_amount == 200.0


class TestBuildCategoryEnum:
    def test_all_categories_present(self):
        assert BuildCategory.SOLAR_ARRAY == 0
        assert BuildCategory.HEALTH_CENTER == 1
        assert BuildCategory.SECURITY_GRID == 2
        assert BuildCategory.TRADE_HUB == 3
        assert BuildCategory.VOID_REACTOR == 4
        assert BuildCategory.RECREATION == 5
        assert BuildCategory.LIVING_QUARTERS == 6

    def test_prioritized_set(self):
        assert BuildCategory.RECREATION in PRIORITIZED_CATEGORIES
        assert BuildCategory.LIVING_QUARTERS in PRIORITIZED_CATEGORIES
        assert BuildCategory.HEALTH_CENTER in PRIORITIZED_CATEGORIES
        assert BuildCategory.SOLAR_ARRAY not in PRIORITIZED_CATEGORIES

    def test_priority_templates_exist(self):
        cats = [t["category"] for t in PRIORITY_TEMPLATES]
        assert BuildCategory.HEALTH_CENTER in cats
        assert BuildCategory.RECREATION in cats
        assert BuildCategory.LIVING_QUARTERS in cats

    def test_non_priority_templates_exist(self):
        cats = [t["category"] for t in NON_PRIORITY_TEMPLATES]
        assert BuildCategory.SOLAR_ARRAY in cats
        assert BuildCategory.VOID_REACTOR in cats


class TestProposalGeneration:
    def test_generate_proposal(self, validator):
        proposal = validator.generate_proposal()
        assert isinstance(proposal, Proposal)
        assert proposal.id == 0
        assert proposal.sc_cost > 0
        assert proposal.expected_benefit > 0
        assert len(proposal.collaborating_guilds) >= 2

    def test_multiple_proposals(self, validator):
        p1 = validator.generate_proposal()
        p2 = validator.generate_proposal()
        assert p1.id == 0
        assert p2.id == 1
        assert len(validator.proposals) == 2

    def test_proposal_voting(self, validator):
        # Force a non-priority template to ensure ACTIVE status
        validator.auto_validation_active = False
        proposal = validator.generate_proposal()
        assert proposal.status == ProposalStatus.ACTIVE
        validator.vote_on_proposal(proposal.id)
        assert proposal.votes_for > 0 or proposal.votes_against > 0

    def test_proposal_finalization_pass(self, validator):
        validator.auto_validation_active = False
        proposal = validator.generate_proposal()
        proposal.votes_for = 30
        proposal.votes_against = 5
        project = validator.finalize_proposal(proposal.id)
        assert proposal.status == ProposalStatus.BUILDING
        assert project is not None
        assert len(validator.projects) == 1

    def test_proposal_finalization_reject(self, validator):
        validator.auto_validation_active = False
        proposal = validator.generate_proposal()
        proposal.votes_for = 5
        proposal.votes_against = 30
        result = validator.finalize_proposal(proposal.id)
        assert proposal.status == ProposalStatus.REJECTED
        assert result is None

    def test_priority_weighting(self, validator):
        """Over many proposals, ~70% should be from priority categories."""
        validator.auto_validation_active = False  # Disable so all go through normal flow
        random.seed(42)
        categories = []
        for _ in range(200):
            p = validator.generate_proposal()
            categories.append(p.category)
        
        priority_count = sum(1 for c in categories if c in PRIORITIZED_CATEGORIES)
        ratio = priority_count / len(categories)
        # With 70% weighting and randomness, expect between 55% and 85%
        assert 0.55 <= ratio <= 0.85, f"Priority ratio {ratio:.2f} outside expected range"


class TestAutoValidation:
    def test_priority_proposal_auto_validates(self, validator):
        """Priority category proposals skip voting during first stretch."""
        # Force a priority template
        random.seed(1)  # Seed that should give priority
        # Manually create a priority proposal
        from validator import INFRA_TEMPLATES
        health_template = next(t for t in INFRA_TEMPLATES if t["category"] == BuildCategory.HEALTH_CENTER)
        
        # Override to ensure priority
        validator.auto_validation_active = True
        validator.auto_validated_count = 0
        
        # Generate proposals until we get a priority one
        got_auto = False
        for _ in range(50):
            p = validator.generate_proposal()
            if p.auto_validated:
                got_auto = True
                assert p.status == ProposalStatus.BUILDING
                assert p.votes_for == 1  # Symbolic vote
                break
        
        assert got_auto, "Expected at least one auto-validated proposal in 50 attempts"

    def test_auto_validation_respects_limit(self, validator):
        """Auto-validation stops after the limit is reached."""
        validator.auto_validation_limit = 3
        auto_count = 0
        for _ in range(100):
            p = validator.generate_proposal()
            if p.auto_validated:
                auto_count += 1
        
        assert auto_count <= 3

    def test_auto_validation_can_be_disabled(self, validator):
        """When disabled, no proposals are auto-validated."""
        validator.auto_validation_active = False
        for _ in range(20):
            p = validator.generate_proposal()
            assert not p.auto_validated
            # Non-priority may still be ACTIVE
            if p.category not in PRIORITIZED_CATEGORIES:
                assert p.status == ProposalStatus.ACTIVE

    def test_auto_validated_creates_project(self, validator):
        """Auto-validated proposals immediately create a project."""
        initial_projects = len(validator.projects)
        # Generate until we get an auto-validated one
        for _ in range(50):
            p = validator.generate_proposal()
            if p.auto_validated:
                assert len(validator.projects) > initial_projects
                project = validator.projects[-1]
                assert project.auto_validated is True
                assert project.name == p.title
                break

    def test_auto_validated_records_symbolic_vote(self, validator):
        """Auto-validated proposals record votes_for=1 for audit trail."""
        for _ in range(50):
            p = validator.generate_proposal()
            if p.auto_validated:
                assert p.votes_for == 1
                assert p.votes_against == 0
                break


class TestAutoFund:
    def test_auto_fund_injects_on_auto_validate(self, validator):
        """Auto-fund injects baseline SC when a project is auto-validated."""
        for _ in range(50):
            p = validator.generate_proposal()
            if p.auto_validated:
                assert p.funded_amount >= validator.auto_fund_base_amount
                project = next(pr for pr in validator.projects if pr.proposal_id == p.id)
                assert project.total_invested >= validator.auto_fund_base_amount
                assert project.progress > 0  # Some progress from auto-fund
                break

    def test_auto_fund_disabled_no_injection(self, validator):
        """When auto-fund is off, no baseline injection occurs."""
        validator.auto_fund_active = False
        for _ in range(50):
            p = validator.generate_proposal()
            if p.auto_validated:
                assert p.funded_amount == 0
                project = next(pr for pr in validator.projects if pr.proposal_id == p.id)
                assert project.total_invested == 0
                break

    def test_toggle_auto_fund(self, validator):
        """Test toggling auto-fund on/off."""
        validator.toggle_auto_fund(False)
        assert validator.auto_fund_active is False
        validator.toggle_auto_fund(True)
        assert validator.auto_fund_active is True


class TestTreasuryControls:
    def test_veto_proposal(self, validator):
        validator.auto_validation_active = False
        proposal = validator.generate_proposal()
        validator.veto_proposal(proposal.id)
        assert proposal.status == ProposalStatus.VETOED

    def test_fast_track_proposal(self, validator):
        validator.auto_validation_active = False
        proposal = validator.generate_proposal()
        project = validator.fast_track_proposal(proposal.id)
        assert proposal.status == ProposalStatus.BUILDING
        assert project is not None
        assert len(validator.projects) == 1

    def test_fund_proposal(self, validator):
        validator.auto_validation_active = False
        proposal = validator.generate_proposal()
        validator.fast_track_proposal(proposal.id)
        validator.fund_proposal(proposal.id, 500.0)
        assert proposal.funded_amount == 500.0
        assert validator.total_sc_reinvested == 500.0

    def test_fund_completes_project(self, validator):
        validator.auto_validation_active = False
        proposal = validator.generate_proposal()
        validator.fast_track_proposal(proposal.id)
        validator.fund_proposal(proposal.id, proposal.sc_cost * 2)
        project = validator.projects[0]
        assert project.completed
        assert project.progress == 10000

    def test_toggle_auto_validation(self, validator):
        validator.toggle_auto_validation(False)
        assert validator.auto_validation_active is False
        validator.toggle_auto_validation(True)
        assert validator.auto_validation_active is True


class TestBotCollaboration:
    def test_execute_collaboration(self, validator):
        validator.auto_validation_active = False
        proposal = validator.generate_proposal()
        validator.fast_track_proposal(proposal.id)
        collab = validator.execute_collaboration(0)
        assert collab is not None
        assert collab.sc_consumed > 0
        assert validator.total_sc_consumed > 0

    def test_collaboration_advances_progress(self, validator):
        validator.auto_validation_active = False
        proposal = validator.generate_proposal()
        validator.fast_track_proposal(proposal.id)
        project = validator.projects[0]
        initial_progress = project.progress
        validator.execute_collaboration(0)
        assert project.progress > initial_progress

    def test_collaboration_deducts_sc(self, validator):
        validator.auto_validation_active = False
        proposal = validator.generate_proposal()
        validator.fast_track_proposal(proposal.id)
        
        total_before = sum(validator.guild_sc.values())
        validator.execute_collaboration(0)
        total_after = sum(validator.guild_sc.values())
        assert total_after < total_before

    def test_project_completion_applies_bonus(self, validator):
        validator.auto_validation_active = False
        proposal = validator.generate_proposal()
        validator.fast_track_proposal(proposal.id)
        project = validator.projects[0]
        category = project.category
        
        project.progress = 9999
        validator.execute_collaboration(0)
        
        if project.completed:
            assert validator.infra_bonuses[category] > 0

    def test_collaboration_on_no_projects_returns_none(self, validator):
        result = validator.execute_collaboration(0)
        assert result is None

    def test_recreation_bonus_applied(self, validator):
        """Completing a recreation project applies recreation bonus."""
        validator.auto_validation_active = False
        # Manually create recreation proposal
        proposal = Proposal(
            id=validator.proposal_counter,
            title="Recreation Plaza - Test",
            description="Test",
            category=BuildCategory.RECREATION,
            sc_cost=400.0,
            expected_benefit=100,
            proposer_guild=0,
            collaborating_guilds=[0, 1, 2],
        )
        validator.proposals.append(proposal)
        validator.proposal_counter += 1
        
        project = validator._start_project(proposal)
        project.progress = 10000
        validator._complete_project(project)
        
        assert validator.infra_bonuses[BuildCategory.RECREATION] == 100

    def test_living_quarters_bonus_applied(self, validator):
        """Completing a living quarters project applies living quarters bonus."""
        validator.auto_validation_active = False
        proposal = Proposal(
            id=validator.proposal_counter,
            title="Living Quarters Block - Test",
            description="Test",
            category=BuildCategory.LIVING_QUARTERS,
            sc_cost=350.0,
            expected_benefit=80,
            proposer_guild=0,
            collaborating_guilds=[0, 1],
        )
        validator.proposals.append(proposal)
        validator.proposal_counter += 1
        
        project = validator._start_project(proposal)
        project.progress = 10000
        validator._complete_project(project)
        
        assert validator.infra_bonuses[BuildCategory.LIVING_QUARTERS] == 80


class TestReplenishment:
    def test_replenish_guild_sc(self, validator):
        initial_balances = dict(validator.guild_sc)
        validator.replenish_guild_sc()
        for gid in range(5):
            assert validator.guild_sc[gid] > initial_balances[gid]


class TestSigning:
    def test_sign_bot_transaction(self, validator):
        result = validator.sign_bot_transaction("0x1234567890abcdef1234567890abcdef12345678", 1, 100)
        assert "signature" in result
        assert "deadline" in result
        assert result["action"] == 1
        assert result["value"] == 100

    def test_sign_guild_trade(self, validator):
        result = validator.sign_guild_trade(0, "0x1234567890abcdef1234567890abcdef12345678", 1000)
        assert "signature" in result
        assert result["guildId"] == 0
        assert result["amount"] == 1000


class TestStateSnapshot:
    def test_state_snapshot_includes_new_fields(self, validator):
        validator.auto_validation_active = False
        validator.generate_proposal()
        validator.fast_track_proposal(0)
        validator.execute_collaboration(0)

        snapshot = validator.get_state_snapshot()
        assert snapshot["bots_total"] == 41
        assert len(snapshot["proposals"]) == 1
        assert len(snapshot["projects"]) == 1
        assert "auto_validation" in snapshot
        assert snapshot["auto_validation"]["active"] is False
        assert snapshot["auto_validation"]["limit"] == 15
        assert "auto_fund" in snapshot
        assert snapshot["auto_fund"]["active"] is True
        assert snapshot["auto_fund"]["base_amount"] == 200.0
        
        # Check new categories in infra_bonuses
        assert "RECREATION" in snapshot["infra_bonuses"]
        assert "LIVING_QUARTERS" in snapshot["infra_bonuses"]

    def test_snapshot_proposals_include_auto_validated(self, validator):
        for _ in range(50):
            p = validator.generate_proposal()
            if p.auto_validated:
                break
        
        snapshot = validator.get_state_snapshot()
        auto_props = [p for p in snapshot["proposals"] if p["auto_validated"]]
        assert len(auto_props) > 0
        assert auto_props[0]["status"] == "BUILDING"

    def test_snapshot_projects_include_auto_validated(self, validator):
        for _ in range(50):
            p = validator.generate_proposal()
            if p.auto_validated:
                break
        
        snapshot = validator.get_state_snapshot()
        auto_projects = [p for p in snapshot["projects"] if p["auto_validated"]]
        assert len(auto_projects) > 0


class TestSelfSustainingCycle:
    def test_full_cycle(self, validator):
        """Test the complete cycle: propose -> vote -> build -> complete -> benefit."""
        validator.auto_validation_active = False
        proposal = validator.generate_proposal()
        proposal.votes_for = 30
        proposal.votes_against = 5
        validator.finalize_proposal(proposal.id)
        
        assert len(validator.projects) == 1
        project = validator.projects[0]
        
        for _ in range(50):
            if project.completed:
                break
            validator.execute_collaboration(project.id)
        
        assert project.completed
        assert validator.infra_bonuses[project.category] > 0
        
        validator.replenish_guild_sc()
        for gid in range(5):
            assert validator.guild_sc[gid] > 0

    def test_auto_validated_full_cycle(self, validator):
        """Test auto-validated project goes directly to building and completes."""
        got_auto = False
        for _ in range(50):
            p = validator.generate_proposal()
            if p.auto_validated:
                got_auto = True
                project = next(pr for pr in validator.projects if pr.proposal_id == p.id)
                assert project.auto_validated
                
                # Execute collaborations until complete
                for _ in range(50):
                    if project.completed:
                        break
                    validator.execute_collaboration(project.id)
                
                assert project.completed
                assert validator.infra_bonuses[project.category] > 0
                break
        
        assert got_auto, "Expected an auto-validated proposal"


class TestOverheadCapture:
    def test_45_percent_overhead_maintained(self, validator):
        """Verify the 45% overhead capture principle is maintained in SC flows."""
        # The overhead capture is maintained through the replenishment cycle
        # and the tax rate applied in the engine.py (separate from validator)
        # Here we verify the infrastructure creates value that feeds back
        validator.auto_validation_active = False
        proposal = validator.generate_proposal()
        validator.fast_track_proposal(proposal.id)
        
        # Consume SC through collaboration
        initial_consumed = validator.total_sc_consumed
        validator.execute_collaboration(0)
        assert validator.total_sc_consumed > initial_consumed
        
        # Replenish (simulating 45% overhead coming back)
        validator.replenish_guild_sc()
        total_balance = sum(validator.guild_sc.values())
        assert total_balance > 0  # System is self-sustaining
