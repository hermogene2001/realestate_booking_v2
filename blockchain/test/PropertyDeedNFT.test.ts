import { expect } from "chai";
import { ethers } from "hardhat";
import { PropertyDeedNFT } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("PropertyDeedNFT", function () {
  let nft: PropertyDeedNFT;
  let admin: HardhatEthersSigner;
  let user: HardhatEthersSigner;

  beforeEach(async function () {
    [admin, user] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("PropertyDeedNFT");
    nft = await Factory.deploy();
    await nft.waitForDeployment();
  });

  it("should mint a deed NFT", async function () {
    const tx = await nft.mintDeed(user.address, 1, "Kigali, Rwanda", 100);
    await expect(tx).to.emit(nft, "DeedMinted").withArgs(1, user.address, 1, "Kigali, Rwanda");
    expect(await nft.ownerOf(1)).to.equal(user.address);
  });

  it("should revoke a deed", async function () {
    await nft.mintDeed(user.address, 1, "Kigali", 100);
    const tx = await nft.revokeDeed(1);
    await expect(tx).to.emit(nft, "DeedRevoked").withArgs(1, 1);
    const deed = await nft.getDeedDetails(1);
    expect(deed.isActive).to.be.false;
  });
});
