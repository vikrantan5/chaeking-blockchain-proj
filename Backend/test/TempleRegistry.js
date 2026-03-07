import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("TempleRegistry", function () {
  let TempleRegistry, registry, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    TempleRegistry = await ethers.getContractFactory("TempleRegistry");
    registry = await TempleRegistry.deploy();
    await registry.waitForDeployment();
  });

  it("Should set the deployer as superAdmin", async function () {
    expect(await registry.superAdmin()).to.equal(owner.address);
  });

  it("Should register a temple", async function () {
    await registry.registerTemple(addr1.address);
    expect(await registry.isRegistered(addr1.address)).to.be.true;
    const temples = await registry.getAllTemples();
    expect(temples).to.include(addr1.address);
  });

  it("Should not allow non-superAdmin to register a temple", async function () {
    await expect(
      registry.connect(addr1).registerTemple(addr2.address)
    ).to.be.revertedWith("Not super admin");
  });

  it("Should remove a registered temple", async function () {
    await registry.registerTemple(addr1.address);
    await registry.removeTemple(addr1.address);
    expect(await registry.isRegistered(addr1.address)).to.be.false;
    const temples = await registry.getAllTemples();
    expect(temples).to.not.include(addr1.address);
  });

  it("Should transfer superAdmin", async function () {
    await registry.transferSuperAdmin(addr1.address);
    expect(await registry.superAdmin()).to.equal(addr1.address);
  });

  it("Should prevent duplicate temple registration", async function () {
    await registry.registerTemple(addr1.address);
    await expect(
      registry.registerTemple(addr1.address)
    ).to.be.revertedWith("Already registered");
  });

  it("Should not allow removal of unregistered temple", async function () {
    await expect(
      registry.removeTemple(addr1.address)
    ).to.be.revertedWith("Not registered");
  });

  it("Should allow new superAdmin to register a temple after transfer", async function () {
    await registry.transferSuperAdmin(addr1.address);
    await registry.connect(addr1).registerTemple(addr2.address);
    expect(await registry.isRegistered(addr2.address)).to.be.true;
  });

  it("Should prevent old superAdmin from registering after transfer", async function () {
    await registry.transferSuperAdmin(addr1.address);
    await expect(
      registry.registerTemple(addr2.address)
    ).to.be.revertedWith("Not super admin");
  });

  it("Should update temple list correctly after multiple operations", async function () {
    await registry.registerTemple(addr1.address);
    await registry.registerTemple(addr2.address);
    await registry.removeTemple(addr1.address);
    const temples = await registry.getAllTemples();
    expect(temples).to.deep.equal([addr2.address]);
  });

  it("Should prevent transferring superAdmin to zero address", async function () {
    await expect(
      registry.transferSuperAdmin("0x0000000000000000000000000000000000000000")
    ).to.be.revertedWith("Invalid address");
  });
});
