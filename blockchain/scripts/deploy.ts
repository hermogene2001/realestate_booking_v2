/**
 * Deploy all contracts.
 * For individual contracts, use `npx hardhat run scripts/deploy-all.ts`.
 */
import { ethers } from "hardhat";

async function main() {
  const FEE_BPS = 250; // 2.5%

  console.log("Deploying RealEstateEscrow...");

  const Factory = await ethers.getContractFactory("RealEstateEscrow");
  const escrow = await Factory.deploy(FEE_BPS);
  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  console.log(`RealEstateEscrow deployed to: ${address}`);
  console.log(`Platform fee: ${FEE_BPS / 100}%`);
  console.log(`Admin: ${await escrow.admin()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
