import { BlockchainService } from '../src/services/blockchain.service';

async function main() {
  console.log('Testing blockchain connection...\n');

  // 1. Check if blockchain is available
  const available = await BlockchainService.isAvailable();
  console.log(`Blockchain available: ${available}`);
  if (!available) {
    console.error('ERROR: Blockchain not available!');
    process.exit(1);
  }

  // 2. Check admin balance
  try {
    const balance = await BlockchainService.getAdminBalance();
    console.log(`Admin wallet balance: ${balance} ETH\n`);
  } catch (e: any) {
    console.error(`ERROR getting balance: ${e.message}`);
    process.exit(1);
  }

  // 3. Submit test escrow using a DIFFERENT owner address (tenant ≠ owner check)
  // In production, ownerAddress comes from the property owner's wallet in user records
  // Using a different address than the admin to satisfy contract rule
  const ownerAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // Hardhat test wallet #7
  try {
    console.log(`Submitting test escrow (0.001 ETH, owner: ${ownerAddress})...`);
    const result = await BlockchainService.submitEscrow({
      propertyId: 1,
      ownerAddress: ownerAddress,
      depositEth: '0.001',
    });
    console.log(`✅ Escrow submitted successfully!`);
    console.log(`   Tx hash: ${result.txHash}`);
    console.log(`   Blockchain booking ID: ${result.blockchainBookingId}`);
  } catch (e: any) {
    console.error(`ERROR: ${e.reason || e.message}`);
    process.exit(1);
  }

  console.log('\n✅ All blockchain tests passed!');
  console.log('\nThe system correctly:');
  console.log('  1. Connects to the local Hardhat node');
  console.log('  2. Reads the admin wallet balance');
  console.log('  3. Submits escrow deposits to the RealEstateEscrow smart contract');
  console.log('  4. Returns on-chain transaction hashes');
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});