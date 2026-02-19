const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TokenFaucet", function () {
  const NAME = "FaucetToken";
  const SYMBOL = "FAUCET";
  const MAX_SUPPLY = ethers.parseUnits("1000000", 18);
  const FAUCET_AMOUNT = ethers.parseUnits("100", 18);
  const MAX_CLAIM_AMOUNT = ethers.parseUnits("1000", 18);

  async function deployFixture() {
    const [deployer, user, other] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("FaucetToken");
    const token = await Token.deploy(NAME, SYMBOL, MAX_SUPPLY, deployer.address);

    const Faucet = await ethers.getContractFactory("TokenFaucet");
    const faucet = await Faucet.deploy(await token.getAddress());

    await token.setMinter(await faucet.getAddress());

    return { token, faucet, deployer, user, other };
  }

  it("deploys with correct admin and paused state", async function () {
    const { faucet, deployer } = await deployFixture();
    expect(await faucet.admin()).to.equal(deployer.address);
    expect(await faucet.isPaused()).to.equal(false);
  });

  it("allows successful token claim", async function () {
    const { faucet, token, user } = await deployFixture();

    await expect(faucet.connect(user).requestTokens())
      .to.emit(faucet, "TokensClaimed")
      .withArgs(user.address, FAUCET_AMOUNT, await time.latest());

    expect(await token.balanceOf(user.address)).to.equal(FAUCET_AMOUNT);
    expect(await faucet.totalClaimed(user.address)).to.equal(FAUCET_AMOUNT);
  });

  it("enforces cooldown", async function () {
    const { faucet, user } = await deployFixture();

    await faucet.connect(user).requestTokens();
    await expect(faucet.connect(user).requestTokens()).to.be.revertedWith(
      "Cooldown period not elapsed"
    );

    await time.increase(24 * 60 * 60 + 1);
    await expect(faucet.connect(user).requestTokens()).to.not.be.reverted;
  });

  it("enforces lifetime limit", async function () {
    const { faucet, user } = await deployFixture();

    for (let i = 0; i < 10; i++) {
      await faucet.connect(user).requestTokens();
      await time.increase(24 * 60 * 60 + 1);
    }

    expect(await faucet.totalClaimed(user.address)).to.equal(MAX_CLAIM_AMOUNT);

    await expect(faucet.connect(user).requestTokens()).to.be.revertedWith(
      "Lifetime claim limit reached"
    );
  });

  it("pause mechanism works and is admin-only", async function () {
    const { faucet, user, deployer, other } = await deployFixture();

    await expect(faucet.connect(other).setPaused(true)).to.be.revertedWith(
      "Only admin"
    );

    await expect(faucet.connect(deployer).setPaused(true))
      .to.emit(faucet, "FaucetPaused")
      .withArgs(true);

    await expect(faucet.connect(user).requestTokens()).to.be.revertedWith(
      "Faucet is paused"
    );
  });

  it("remaining allowance reflects claims", async function () {
    const { faucet, user } = await deployFixture();

    expect(await faucet.remainingAllowance(user.address)).to.equal(MAX_CLAIM_AMOUNT);

    await faucet.connect(user).requestTokens();
    const remaining = await faucet.remainingAllowance(user.address);
    expect(remaining).to.equal(MAX_CLAIM_AMOUNT - FAUCET_AMOUNT);
  });

  it("canClaim returns false when paused or cooldown", async function () {
    const { faucet, user, deployer } = await deployFixture();

    expect(await faucet.canClaim(user.address)).to.equal(true);
    await faucet.connect(user).requestTokens();
    expect(await faucet.canClaim(user.address)).to.equal(false);

    await faucet.connect(deployer).setPaused(true);
    expect(await faucet.canClaim(user.address)).to.equal(false);
  });
});
