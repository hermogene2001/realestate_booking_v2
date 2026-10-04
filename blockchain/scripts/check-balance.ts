import { ethers } from "hardhat";

async function main() {
  const address = process.argv[2] || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const balance = await ethers.provider.getBalance(address);
  console.log(`Balance of ${address}: ${ethers.formatEther(balance)} ETH`);
  console.log(`Network: ${(await ethers.provider.getNetwork()).name}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
