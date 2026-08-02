const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WillstoneNexus", function () {
  let nexus, mockBedrock, owner, treasury, trader, bot;

  beforeEach(async function () {
    [owner, treasury, trader, bot] = await ethers.getSigners();

    const MockL1Bedrock = await ethers.getContractFactory("MockL1Bedrock");
    mockBedrock = await MockL1Bedrock.deploy();
    await mockBedrock.waitForDeployment();

    const WillstoneNexus = await ethers.getContractFactory("WillstoneNexus");
    nexus = await WillstoneNexus.deploy(treasury.address, await mockBedrock.getAddress());
    await nexus.waitForDeployment();

    // Grant roles
    const GUILD_MASTER_ROLE = await nexus.GUILD_MASTER_ROLE();
    const BOT_VALIDATOR_ROLE = await nexus.BOT_VALIDATOR_ROLE();
    const SOLAR_OPERATOR_ROLE = await nexus.SOLAR_OPERATOR_ROLE();
    await nexus.grantRole(GUILD_MASTER_ROLE, owner.address);
    await nexus.grantRole(BOT_VALIDATOR_ROLE, bot.address);
    await nexus.grantRole(SOLAR_OPERATOR_ROLE, owner.address);
  });

  describe("Initialization", function () {
    it("Should set correct Willstone anchor", async function () {
      const [anchor, status] = await nexus.getWillstoneStatus();
      expect(anchor).to.equal(ethers.parseEther("450000000"));
      expect(status).to.equal("SOVEREIGN_ACTIVE");
    });

    it("Should set 45% overhead tax", async function () {
      expect(await nexus.overheadTaxBps()).to.equal(4500);
    });

    it("Should initialize 5 guilds", async function () {
      const g0 = await nexus.guilds(0);
      expect(g0.name).to.equal("Sovereign Authority");
      expect(g0.active).to.be.true;

      const g4 = await nexus.guilds(4);
      expect(g4.name).to.equal("Void Syndicate");
    });
  });

  describe("Guild Trade with EIP-712", function () {
    it("Should execute valid guild trade", async function () {
      const amount = ethers.parseEther("1");
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const nonce = await nexus.traderNonces(trader.address);

      const domain = {
        name: "WillstoneNexus",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await nexus.getAddress()
      };

      const types = {
        GuildTrade: [
          { name: "guildId", type: "uint256" },
          { name: "trader", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" }
        ]
      };

      const value = {
        guildId: 0,
        trader: trader.address,
        amount: amount,
        nonce: nonce,
        deadline: deadline
      };

      const signature = await owner.signTypedData(domain, types, value);

      const treasuryBalBefore = await ethers.provider.getBalance(treasury.address);
      
      await nexus.connect(trader).executeGuildTrade(0, amount, deadline, signature, { value: amount });

      const treasuryBalAfter = await ethers.provider.getBalance(treasury.address);
      const expectedTax = amount * 4500n / 10000n;
      expect(treasuryBalAfter - treasuryBalBefore).to.equal(expectedTax);
    });

    it("Should reject expired trade", async function () {
      const amount = ethers.parseEther("1");
      const deadline = Math.floor(Date.now() / 1000) - 3600;
      const signature = "0x" + "00".repeat(65);

      await expect(
        nexus.connect(trader).executeGuildTrade(0, amount, deadline, signature, { value: amount })
      ).to.be.revertedWith("WN: Trade expired");
    });
  });

  describe("Treasury Controls", function () {
    it("Should allow treasury to adjust tax", async function () {
      await nexus.connect(treasury).setOverheadTax(5000);
      expect(await nexus.overheadTaxBps()).to.equal(5000);
    });

    it("Should reject non-treasury tax changes", async function () {
      await expect(
        nexus.connect(trader).setOverheadTax(1000)
      ).to.be.reverted;
    });

    it("Should toggle guild activity", async function () {
      await nexus.connect(treasury).toggleGuild(2, false);
      const guild = await nexus.guilds(2);
      expect(guild.active).to.be.false;
    });
  });

  describe("Solar Export", function () {
    it("Should initiate solar export to L1", async function () {
      // Fund the contract
      await owner.sendTransaction({ to: await nexus.getAddress(), value: ethers.parseEther("10") });

      await nexus.initiateSolarExport(ethers.parseEther("5"));
      expect(await nexus.totalBridgedToL1()).to.equal(ethers.parseEther("5"));
      expect(await nexus.getSolarExportCount()).to.equal(1);
    });

    it("Should settle solar export", async function () {
      await owner.sendTransaction({ to: await nexus.getAddress(), value: ethers.parseEther("10") });
      await nexus.initiateSolarExport(ethers.parseEther("5"));

      const txHash = ethers.keccak256(ethers.toUtf8Bytes("settlement-1"));
      await nexus.settleSolarExport(0, txHash);
      
      const exp = await nexus.solarExports(0);
      expect(exp.settled).to.be.true;
      expect(exp.l1TxHash).to.equal(txHash);
    });
  });

  describe("Bot Transaction Validation", function () {
    it("Should validate bot transaction with EIP-712 signature", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const nonce = await nexus.botNonces(bot.address);

      const domain = {
        name: "WillstoneNexus",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await nexus.getAddress()
      };

      const types = {
        BotTransaction: [
          { name: "bot", type: "address" },
          { name: "action", type: "uint256" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" }
        ]
      };

      const value = {
        bot: bot.address,
        action: 1,
        value: ethers.parseEther("0.5"),
        nonce: nonce,
        deadline: deadline
      };

      const signature = await bot.signTypedData(domain, types, value);

      await expect(
        nexus.validateBotTransaction(bot.address, 1, ethers.parseEther("0.5"), deadline, signature)
      ).to.emit(nexus, "BotTransactionValidated");
    });
  });
});
