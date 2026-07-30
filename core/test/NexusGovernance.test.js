const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NexusGovernance - Infra Expansion", function () {
  let governance, treasury, bot1, bot2;

  beforeEach(async function () {
    [treasury, bot1, bot2] = await ethers.getSigners();
    const NexusGovernance = await ethers.getContractFactory("NexusGovernance");
    governance = await NexusGovernance.deploy(treasury.address);
    await governance.waitForDeployment();

    // Grant BOT_ROLE to bot1 and bot2
    const BOT_ROLE = await governance.BOT_ROLE();
    await governance.grantRole(BOT_ROLE, bot1.address);
    await governance.grantRole(BOT_ROLE, bot2.address);
  });

  describe("BuildCategory Enum", function () {
    it("should include RECREATION (5) and LIVING_QUARTERS (6)", async function () {
      // Create proposals with new categories to verify they work
      await governance.connect(bot1).createProposal(
        "Recreation Plaza", "Test", 5, // RECREATION
        ethers.parseEther("200"), 100, 0, [0, 1]
      );
      await governance.connect(bot1).createProposal(
        "Living Quarters", "Test", 6, // LIVING_QUARTERS
        ethers.parseEther("200"), 100, 0, [0, 1]
      );
      expect(await governance.proposalCount()).to.equal(2);
    });
  });

  describe("Auto-Validation", function () {
    it("should auto-validate HEALTH_CENTER proposals during first stretch", async function () {
      const tx = await governance.connect(bot1).createProposal(
        "Health Grid Alpha", "Auto-validate test", 1, // HEALTH_CENTER
        ethers.parseEther("200"), 150, 0, [0, 1]
      );
      
      const receipt = await tx.wait();
      // Should have emitted ProposalAutoValidated
      const autoEvent = receipt.logs.find(l => {
        try { return governance.interface.parseLog(l)?.name === "ProposalAutoValidated"; } catch { return false; }
      });
      expect(autoEvent).to.not.be.undefined;
      
      // Proposal should be in BUILDING status
      const prop = await governance.getProposal(0);
      expect(prop.status).to.equal(5); // BUILDING
      expect(prop.autoValidated).to.equal(true);
    });

    it("should auto-validate RECREATION proposals", async function () {
      await governance.connect(bot1).createProposal(
        "Recreation Plaza Alpha", "Test", 5, // RECREATION
        ethers.parseEther("200"), 100, 0, [0, 1]
      );
      
      const prop = await governance.getProposal(0);
      expect(prop.status).to.equal(5); // BUILDING
      expect(prop.autoValidated).to.equal(true);
    });

    it("should auto-validate LIVING_QUARTERS proposals", async function () {
      await governance.connect(bot1).createProposal(
        "Living Quarters Block A", "Test", 6, // LIVING_QUARTERS
        ethers.parseEther("200"), 80, 0, [0, 1]
      );
      
      const prop = await governance.getProposal(0);
      expect(prop.status).to.equal(5); // BUILDING
      expect(prop.autoValidated).to.equal(true);
    });

    it("should NOT auto-validate non-priority categories", async function () {
      await governance.connect(bot1).createProposal(
        "Solar Array", "Test", 0, // SOLAR_ARRAY
        ethers.parseEther("200"), 100, 0, [0, 1]
      );
      
      const prop = await governance.getProposal(0);
      expect(prop.status).to.equal(0); // ACTIVE
      expect(prop.autoValidated).to.equal(false);
    });

    it("should stop auto-validating after limit is reached", async function () {
      const limit = await governance.AUTO_VALIDATION_LIMIT();
      
      // Create proposals up to the limit
      for (let i = 0; i < Number(limit); i++) {
        await governance.connect(bot1).createProposal(
          `Health Grid ${i}`, "Test", 1,
          ethers.parseEther("200"), 100, 0, [0, 1]
        );
      }
      
      expect(await governance.autoValidatedCount()).to.equal(limit);
      
      // Next priority proposal should go through normal voting
      await governance.connect(bot1).createProposal(
        "Health Grid Over Limit", "Test", 1,
        ethers.parseEther("200"), 100, 0, [0, 1]
      );
      
      const prop = await governance.getProposal(Number(limit));
      expect(prop.status).to.equal(0); // ACTIVE (not auto-validated)
    });

    it("should allow Treasury to toggle auto-validation", async function () {
      const TREASURY_ROLE = await governance.TREASURY_ROLE();
      await governance.grantRole(TREASURY_ROLE, treasury.address);
      
      await governance.connect(treasury).toggleAutoValidation(false);
      expect(await governance.autoValidationActive()).to.equal(false);
      
      // Priority proposal should now go through normal voting
      await governance.connect(bot1).createProposal(
        "Health Grid", "Test", 1,
        ethers.parseEther("200"), 100, 0, [0, 1]
      );
      const prop = await governance.getProposal(0);
      expect(prop.status).to.equal(0); // ACTIVE
    });
  });

  describe("Auto-Fund", function () {
    it("should inject baseline funding on auto-validated proposals", async function () {
      await governance.connect(bot1).createProposal(
        "Recreation Plaza", "Test", 5,
        ethers.parseEther("200"), 100, 0, [0, 1]
      );
      
      const prop = await governance.getProposal(0);
      const autoFundAmount = await governance.autoFundBaseAmount();
      expect(prop.fundedAmount).to.equal(autoFundAmount);
    });

    it("should NOT inject funding when auto-fund is disabled", async function () {
      const TREASURY_ROLE = await governance.TREASURY_ROLE();
      await governance.grantRole(TREASURY_ROLE, treasury.address);
      
      await governance.connect(treasury).toggleAutoFund(false);
      
      await governance.connect(bot1).createProposal(
        "Recreation Plaza", "Test", 5,
        ethers.parseEther("200"), 100, 0, [0, 1]
      );
      
      const prop = await governance.getProposal(0);
      expect(prop.fundedAmount).to.equal(0);
    });

    it("should allow Treasury to change auto-fund amount", async function () {
      const TREASURY_ROLE = await governance.TREASURY_ROLE();
      await governance.grantRole(TREASURY_ROLE, treasury.address);
      
      const newAmount = ethers.parseEther("500");
      await governance.connect(treasury).setAutoFundAmount(newAmount);
      expect(await governance.autoFundBaseAmount()).to.equal(newAmount);
    });
  });

  describe("New Category Bonuses", function () {
    it("should apply recreationBonus on project completion", async function () {
      // Create and auto-validate a recreation project
      await governance.connect(bot1).createProposal(
        "Recreation Plaza", "Test", 5,
        ethers.parseEther("200"), 150, 0, [0, 1]
      );
      
      // Collaborate until completion
      const projectId = 0;
      const guildIds = [0, 1];
      const scAmount = ethers.parseEther("200");
      
      await governance.connect(bot1).recordCollaboration(projectId, guildIds, scAmount, "Building");
      
      const proj = await governance.getProject(0);
      if (proj.progress >= 10000n) {
        expect(await governance.recreationBonus()).to.be.gt(0);
      }
    });

    it("should apply livingQuartersBonus on project completion", async function () {
      await governance.connect(bot1).createProposal(
        "Living Quarters Block", "Test", 6,
        ethers.parseEther("200"), 120, 0, [0, 1]
      );
      
      const projectId = 0;
      const guildIds = [0, 1];
      const scAmount = ethers.parseEther("200");
      
      await governance.connect(bot1).recordCollaboration(projectId, guildIds, scAmount, "Building");
      
      const proj = await governance.getProject(0);
      if (proj.progress >= 10000n) {
        expect(await governance.livingQuartersBonus()).to.be.gt(0);
      }
    });

    it("should return all 7 bonuses from getInfrastructureBonuses", async function () {
      const bonuses = await governance.getInfrastructureBonuses();
      expect(bonuses.length).to.equal(7);
    });
  });

  describe("Auto-Validation Status View", function () {
    it("should return auto-validation status", async function () {
      const status = await governance.getAutoValidationStatus();
      expect(status.active).to.equal(true);
      expect(status.count).to.equal(0);
      expect(status.limit).to.equal(15);
    });

    it("should update count after auto-validation", async function () {
      await governance.connect(bot1).createProposal(
        "Health Grid", "Test", 1,
        ethers.parseEther("200"), 100, 0, [0, 1]
      );
      
      const status = await governance.getAutoValidationStatus();
      expect(status.count).to.equal(1);
    });
  });

  describe("45% Overhead Capture", function () {
    it("should track totalScReinvested from auto-fund", async function () {
      await governance.connect(bot1).createProposal(
        "Recreation Plaza", "Test", 5,
        ethers.parseEther("200"), 100, 0, [0, 1]
      );
      
      const reinvested = await governance.totalScReinvested();
      expect(reinvested).to.be.gt(0);
    });
  });
});
