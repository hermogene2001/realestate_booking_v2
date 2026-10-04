import { ethers } from 'ethers';
import { env } from '../config/env';

const CONTRACT_ABI = [
  'function createBooking(uint256 propertyId, address payable owner, uint256 timeoutDuration) external payable returns (uint256)',
  'function confirmHandover(uint256 bookingId) external',
  'function cancelBooking(uint256 bookingId) external',
  'function raiseDispute(uint256 bookingId) external',
  'function resolveDispute(uint256 bookingId, bool refundBuyer) external',
  'function getBooking(uint256 bookingId) external view returns (tuple(uint256 propertyId, address tenant, address owner, uint256 amount, uint8 state, bool tenantConfirmed, bool ownerConfirmed, uint256 createdAt, uint256 timeoutAt))',
  'function getBookingCount() external view returns (uint256)',
  'event BookingCreated(uint256 indexed bookingId, uint256 propertyId, address tenant, address owner, uint256 amount)',
];

export class BlockchainService {
  private static getProvider() {
    if (!env.BLOCKCHAIN_RPC_URL) throw new Error('Blockchain RPC URL not configured');
    return new ethers.JsonRpcProvider(env.BLOCKCHAIN_RPC_URL);
  }

  private static getAdminWallet() {
    if (!env.ADMIN_WALLET_PRIVATE_KEY) throw new Error('Admin wallet private key not configured');
    const provider = this.getProvider();
    return new ethers.Wallet(env.ADMIN_WALLET_PRIVATE_KEY, provider);
  }

  private static getContract() {
    if (!env.CONTRACT_ADDRESS) throw new Error('Contract address not configured');
    const wallet = this.getAdminWallet();
    return new ethers.Contract(env.CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
  }

  /**
   * Submit a booking escrow to the blockchain on behalf of any payment channel.
   * The admin wallet pays the ETH deposit from its own funds.
   * In production this would be funded by the fiat payment received.
   */
  static async submitEscrow(params: {
    propertyId: number;
    ownerAddress: string;
    depositEth: string;
    timeoutDuration?: number;
  }): Promise<{ txHash: string; blockchainBookingId: string }> {
    const contract = this.getContract();
    const timeout = params.timeoutDuration ?? 30 * 24 * 60 * 60; // 30 days default

    const tx = await contract.createBooking(
      params.propertyId,
      params.ownerAddress,
      timeout,
      { value: ethers.parseEther(params.depositEth) }
    );

    const receipt = await tx.wait();

    // Extract bookingId from BookingCreated event
    let blockchainBookingId = '0';
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed?.name === 'BookingCreated') {
          blockchainBookingId = parsed.args[0].toString();
          break;
        }
      } catch { /* skip unparseable logs */ }
    }

    return { txHash: receipt.hash, blockchainBookingId };
  }

  /**
   * Pay remaining amount — send ETH directly from admin wallet to the owner.
   * This is NOT a contract call; it's a simple ETH transfer for the off-chain
   * remaining payment that gets recorded as a transaction hash.
   */
  static async payRemainingForUser(params: {
    ownerAddress: string;
    amountEth: string;
  }): Promise<{ txHash: string }> {
    const wallet = this.getAdminWallet();
    const tx = await wallet.sendTransaction({
      to: params.ownerAddress,
      value: ethers.parseEther(params.amountEth),
    });
    const receipt = await tx.wait();
    if (!receipt) throw new Error('Payment transaction was not mined');
    return { txHash: receipt.hash };
  }

  /**
   * Check if the blockchain node is reachable and the contract is deployed.
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const provider = this.getProvider();
      await provider.getBlockNumber();
      const code = await provider.getCode(env.CONTRACT_ADDRESS);
      return code !== '0x';
    } catch {
      return false;
    }
  }

  /**
   * Get the admin wallet's current ETH balance.
   */
  static async getAdminBalance(): Promise<string> {
    const wallet = this.getAdminWallet();
    const balance = await wallet.provider!.getBalance(wallet.address);
    return ethers.formatEther(balance);
  }
}
