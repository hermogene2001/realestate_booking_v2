import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}\n`);

  // 1. RealEstateEscrow
  const FEE_BPS = 250;
  console.log("Deploying RealEstateEscrow...");
  const EscrowFactory = await ethers.getContractFactory("RealEstateEscrow");
  const escrow = await EscrowFactory.deploy(FEE_BPS);
  await escrow.waitForDeployment();
  const escrowAddr = await escrow.getAddress();
  console.log(`  RealEstateEscrow -> ${escrowAddr}`);
  console.log(`  Platform fee: ${FEE_BPS / 100}%\n`);

  // 2. PropertyDeedNFT
  console.log("Deploying PropertyDeedNFT...");
  const NFTFactory = await ethers.getContractFactory("PropertyDeedNFT");
  const nft = await NFTFactory.deploy();
  await nft.waitForDeployment();
  const nftAddr = await nft.getAddress();
  console.log(`  PropertyDeedNFT -> ${nftAddr}\n`);

  // 3. DAOGovernance
  console.log("Deploying DAOGovernance...");
  const DAOFactory = await ethers.getContractFactory("DAOGovernance");
  const dao = await DAOFactory.deploy();
  await dao.waitForDeployment();
  const daoAddr = await dao.getAddress();
  console.log(`  DAOGovernance  -> ${daoAddr}\n`);

  // 4. PropertyToken (fractional ownership)
  console.log("Deploying PropertyToken...");
  const TokenFactory = await ethers.getContractFactory("PropertyToken");
  const token = await TokenFactory.deploy();
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log(`  PropertyToken  -> ${tokenAddr}\n`);

  // 5. ReputationScore
  console.log("Deploying ReputationScore...");
  const RepFactory = await ethers.getContractFactory("ReputationScore");
  const rep = await RepFactory.deploy();
  await rep.waitForDeployment();
  const repAddr = await rep.getAddress();
  console.log(`  ReputationScore -> ${repAddr}\n`);

  console.log("=== Deployment Summary ===");
  console.log(`RealEstateEscrow: ${escrowAddr}`);
  console.log(`PropertyDeedNFT: ${nftAddr}`);
  console.log(`DAOGovernance:   ${daoAddr}`);
  console.log(`PropertyToken:   ${tokenAddr}`);
  console.log(`ReputationScore: ${repAddr}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
