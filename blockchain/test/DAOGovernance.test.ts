import { expect } from "chai";
import { ethers } from "hardhat";
import { DAOGovernance } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("DAOGovernance", function () {
  let dao: DAOGovernance;
  let admin: HardhatEthersSigner;
  let member1: HardhatEthersSigner;

  beforeEach(async function () {
    [admin, member1] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("DAOGovernance");
    dao = await Factory.deploy();
    await dao.waitForDeployment();
  });

  it("should set owner to deployer", async function () {
    expect(await dao.owner()).to.equal(admin.address);
  });

  it("should allow owner to add members", async function () {
    await dao.addMember(member1.address, 100);
    const member = await dao.members(member1.address);
    expect(member.isActive).to.be.true;
  });

  it("should create a proposal and retrieve it", async function () {
    await dao.addMember(member1.address, 100);
    const tx = await dao.connect(member1).createProposal("Test proposal");
    await expect(tx).to.emit(dao, "ProposalCreated");
    const proposal = await dao.getProposal(1);
    expect(proposal.description).to.equal("Test proposal");
  });
});
