import { ethers } from 'ethers';
import { env } from '../config/env';
import { prisma } from '../config/database';

const CONTRACT_ABI = [
  'event BookingCreated(uint256 indexed bookingId, uint256 propertyId, address tenant, address owner, uint256 amount)',
  'event Deposited(uint256 indexed bookingId, uint256 amount)',
  'event HandoverConfirmed(uint256 indexed bookingId, address confirmedBy)',
  'event FundsReleased(uint256 indexed bookingId, uint256 ownerAmount, uint256 feeAmount)',
  'event TenantRefunded(uint256 indexed bookingId, uint256 amount)',
  'event BookingCancelled(uint256 indexed bookingId, uint256 refundAmount, uint256 penaltyAmount)',
  'event DisputeRaised(uint256 indexed bookingId, address raisedBy)',
  'event DisputeResolved(uint256 indexed bookingId, bool refundedBuyer)',
];

export class EventListenerService {
  private static provider: ethers.JsonRpcProvider | null = null;
  private static contract: ethers.Contract | null = null;
  private static pollingInterval: ReturnType<typeof setInterval> | null = null;
  private static lastProcessedBlock: number = 0;
  private static isProcessing = false;

  static start(): void {
    if (!env.CONTRACT_ADDRESS || !env.BLOCKCHAIN_RPC_URL) {
      console.log('[EventListener] Skipped: CONTRACT_ADDRESS or BLOCKCHAIN_RPC_URL not configured');
      return;
    }

    try {
      this.provider = new ethers.JsonRpcProvider(env.BLOCKCHAIN_RPC_URL);
      this.contract = new ethers.Contract(env.CONTRACT_ADDRESS, CONTRACT_ABI, this.provider);

      this.poll();
      this.pollingInterval = setInterval(() => this.poll(), 15_000);

      console.log('[EventListener] Started — polling for on-chain events every 15s');
    } catch (err) {
      console.error('[EventListener] Failed to start:', err);
    }
  }

  static stop(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    console.log('[EventListener] Stopped');
  }

  private static async poll(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const currentBlock = await this.provider!.getBlockNumber();
      const fromBlock = this.lastProcessedBlock > 0
        ? this.lastProcessedBlock + 1
        : Math.max(0, currentBlock - 10);

      if (fromBlock > currentBlock) {
        this.isProcessing = false;
        return;
      }

      const events = await this.contract!.queryFilter('*', fromBlock, currentBlock);
      for (const event of events) {
        await this.handleEvent(event);
      }

      this.lastProcessedBlock = currentBlock;
    } catch (err) {
      console.error('[EventListener] Poll error:', err);
    } finally {
      this.isProcessing = false;
    }
  }

  private static async handleEvent(event: ethers.EventLog | ethers.Log): Promise<void> {
    try {
      if (!('eventName' in event) || !event.eventName) return;
      const ev = event as ethers.EventLog;

      switch (ev.eventName) {
        case 'BookingCreated':
          await this.onBookingCreated(ev);
          break;
        case 'HandoverConfirmed':
          await this.onHandoverConfirmed(ev);
          break;
        case 'FundsReleased':
          await this.onFundsReleased(ev);
          break;
        case 'TenantRefunded':
          await this.onTenantRefunded(ev);
          break;
        case 'BookingCancelled':
          await this.onBookingCancelled(ev);
          break;
        case 'DisputeRaised':
          await this.onDisputeRaised(ev);
          break;
        case 'DisputeResolved':
          await this.onDisputeResolved(ev);
          break;
        default:
          break;
      }
    } catch (err) {
      const evName = 'eventName' in event ? (event as ethers.EventLog).eventName : 'unknown';
      console.error(`[EventListener] Error handling ${evName}:`, err);
    }
  }

  private static async onBookingCreated(event: ethers.EventLog): Promise<void> {
    const bookingId = event.args.bookingId?.toString();
    const tenant = event.args.tenant as string;
    const amount = event.args.amount as bigint;

    console.log(`[EventListener] BookingCreated: id=${bookingId}, tenant=${tenant}, amount=${ethers.formatEther(amount)} ETH`);

    const dbBooking = await prisma.booking.findFirst({
      where: { tenant: { walletAddress: tenant.toLowerCase() } },
      orderBy: { createdAt: 'desc' },
    });

    if (dbBooking && dbBooking.status === 'PENDING') {
      await prisma.booking.update({
        where: { id: dbBooking.id },
        data: { status: 'LOCKED', txHash: event.transactionHash },
      });
      await prisma.transaction.create({
        data: {
          bookingId: dbBooking.id,
          txHash: event.transactionHash,
          type: 'DEPOSIT',
          amount: ethers.formatEther(amount),
          status: 'CONFIRMED',
          fromAddress: tenant,
          toAddress: env.CONTRACT_ADDRESS!,
        },
      });
      console.log(`[EventListener] Booking ${dbBooking.id} locked via on-chain event`);
    }
  }

  private static async findByTxHash(event: ethers.EventLog) {
    return prisma.booking.findFirst({
      where: { txHash: event.transactionHash },
    });
  }

  private static async onHandoverConfirmed(event: ethers.EventLog): Promise<void> {
    console.log(`[EventListener] HandoverConfirmed: txHash=${event.transactionHash}`);

    const dbBooking = await this.findByTxHash(event);
    if (dbBooking) {
      await prisma.payment.updateMany({
        where: { bookingId: dbBooking.id },
        data: { status: 'RELEASED' },
      });
    }
  }

  private static async onFundsReleased(event: ethers.EventLog): Promise<void> {
    const ownerAmount = event.args.ownerAmount as bigint;
    console.log(`[EventListener] FundsReleased: txHash=${event.transactionHash}, ownerAmount=${ethers.formatEther(ownerAmount)} ETH`);

    const dbBooking = await this.findByTxHash(event);
    if (dbBooking) {
      await prisma.booking.update({
        where: { id: dbBooking.id },
        data: { status: 'COMPLETED', paymentStatus: 'COMPLETED' },
      });
    }
  }

  private static async onTenantRefunded(event: ethers.EventLog): Promise<void> {
    const amount = event.args.amount as bigint;
    console.log(`[EventListener] TenantRefunded: txHash=${event.transactionHash}, amount=${ethers.formatEther(amount)} ETH`);

    const dbBooking = await this.findByTxHash(event);
    if (dbBooking) {
      await prisma.booking.update({
        where: { id: dbBooking.id },
        data: { status: 'REFUNDED', paymentStatus: 'REFUNDED' },
      });
    }
  }

  private static async onBookingCancelled(event: ethers.EventLog): Promise<void> {
    console.log(`[EventListener] BookingCancelled: txHash=${event.transactionHash}`);

    const dbBooking = await this.findByTxHash(event);
    if (dbBooking && dbBooking.status !== 'REFUNDED') {
      await prisma.booking.update({
        where: { id: dbBooking.id },
        data: { status: 'CANCELLED' },
      });
    }
  }

  private static async onDisputeRaised(event: ethers.EventLog): Promise<void> {
    console.log(`[EventListener] DisputeRaised: txHash=${event.transactionHash}`);

    const dbBooking = await this.findByTxHash(event);
    if (dbBooking) {
      await prisma.booking.update({
        where: { id: dbBooking.id },
        data: { status: 'DISPUTED' },
      });
    }
  }

  private static async onDisputeResolved(event: ethers.EventLog): Promise<void> {
    const refunded = event.args.refundedBuyer as boolean;
    console.log(`[EventListener] DisputeResolved: txHash=${event.transactionHash}, refundedBuyer=${refunded}`);

    const dbBooking = await this.findByTxHash(event);
    if (dbBooking) {
      await prisma.booking.update({
        where: { id: dbBooking.id },
        data: { status: refunded ? 'REFUNDED' as const : 'COMPLETED' as const },
      });
    }
  }
}
