import { ethers } from "hardhat";

async function main() {
  const txHash = "0x3e60e72f05a636579a4c748353bd8f98feb9a569117203459038f1c0b91a8597";
  const tx = await ethers.provider.getTransaction(txHash);
  if (tx) {
    console.log("Transaction found on local Hardhat node:");
    console.log(`  Block: ${tx.blockNumber}`);
    console.log(`  From:  ${tx.from}`);
    console.log(`  To:    ${tx.to}`);
    console.log(`  Value: ${ethers.formatEther(tx.value)} ETH`);
    const receipt = await ethers.provider.getTransactionReceipt(txHash);
    if (receipt) {
      console.log(`  Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`);
      console.log(`  Gas used: ${receipt.gasUsed?.toString()}`);
    }
  } else {
    console.log("Transaction NOT found on local Hardhat node.");
    console.log("This means the txHash does not exist on the Hardhat blockchain.");
  }
}

main().catch(console.error);
