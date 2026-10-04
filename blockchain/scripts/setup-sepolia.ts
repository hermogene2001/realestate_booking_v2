import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  const network = await ethers.provider.getNetwork();
  console.log(`Connected to: ${network.name} (chainId: ${network.chainId})`);

  if (network.chainId !== 11155111n) {
    console.error("This script must be run with --network sepolia");
    process.exit(1);
  }

  // Check if default Hardhat key has balance
  const defaultWallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
  let deployerWallet = defaultWallet;
  let balance = await ethers.provider.getBalance(deployerWallet.address);
  console.log(`\nDefault Hardhat account: ${deployerWallet.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    // Generate a fresh wallet
    const freshWallet = ethers.Wallet.createRandom();
    console.log(`\n⚠ Default account has no Sepolia ETH.`);
    console.log(`\nTo deploy, you need Sepolia test ETH:`);
    console.log(`  1. Fund this address via a faucet:`);
    console.log(`     ${freshWallet.address}`);
    console.log(`  2. Faucets:`);
    console.log(`     - https://www.alchemy.com/faucets/ethereum-sepolia`);
    console.log(`     - https://sepoliafaucet.com (Alchemy, requires login)`);
    console.log(`     - https://faucet.quicknode.com/ethereum/sepolia`);
    console.log(`  3. Update blockchain/.env:`);
    console.log(`     DEPLOYER_PRIVATE_KEY=${freshWallet.privateKey}`);
    console.log(`\nOr use an existing funded wallet:`);
    console.log(`  1. Update blockchain/.env:`);
    console.log(`     DEPLOYER_PRIVATE_KEY=0x<your-funded-key>`);
    console.log(`  2. Run: npx hardhat run scripts/deploy.ts --network sepolia`);
    console.log(`  3. Update frontend/.env.local with the deployed contract address`);
    process.exit(0);
  }

  console.log(`\nDeployer has ${ethers.formatEther(balance)} ETH — ready to deploy!`);
  console.log(`Run: npx hardhat run scripts/deploy.ts --network sepolia`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
