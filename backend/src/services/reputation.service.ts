import { prisma } from '../config/database';
import { env } from '../config/env';
import { ethers } from 'ethers';

const REPUTATION_ABI = [
  'function submitAttestation(address subject, uint8 score, string calldata comment) external',
  'function getReputation(address user) external view returns (tuple(uint256 totalScore, uint256 count, uint256 average, uint256 lastUpdated))',
  'function getAttestationCount(address user) external view returns (uint256)',
  'event ReputationUpdated(address indexed user, uint256 newAverage, uint256 totalCount)',
];

export class ReputationService {
  private static getContract() {
    if (!env.REPUTATION_SCORE_ADDRESS) throw new Error('ReputationScore address not configured');
    const provider = new ethers.JsonRpcProvider(env.BLOCKCHAIN_RPC_URL);
    const wallet = new ethers.Wallet(env.ADMIN_WALLET_PRIVATE_KEY, provider);
    return new ethers.Contract(env.REPUTATION_SCORE_ADDRESS, REPUTATION_ABI, wallet);
  }

  static async submitAttestation(subjectId: number, score: number, comment: string) {
    const subject = await prisma.user.findUnique({ where: { id: subjectId } });
    if (!subject) throw new Error('User not found');
    if (!subject.walletAddress) throw new Error('User has no wallet linked');

    const contract = this.getContract();
    const tx = await contract.submitAttestation(subject.walletAddress, score, comment);
    await tx.wait();

    const rep = await contract.getReputation(subject.walletAddress);

    const upserted = await prisma.userReputation.upsert({
      where: { userId: subjectId },
      update: {
        totalScore: Number(rep.totalScore),
        count: Number(rep.count),
        average: Number(rep.average),
        lastUpdated: new Date(),
      },
      create: {
        userId: subjectId,
        totalScore: Number(rep.totalScore),
        count: Number(rep.count),
        average: Number(rep.average),
        lastUpdated: new Date(),
      },
    });

    return upserted;
  }

  static async getReputation(userId: number) {
    let rep = await prisma.userReputation.findUnique({ where: { userId } });

    if (!rep) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.walletAddress) {
        try {
          const contract = this.getContract();
          const onChain = await contract.getReputation(user.walletAddress);
          if (Number(onChain.count) > 0) {
            rep = await prisma.userReputation.upsert({
              where: { userId },
              update: {
                totalScore: Number(onChain.totalScore),
                count: Number(onChain.count),
                average: Number(onChain.average),
                lastUpdated: new Date(),
              },
              create: {
                userId,
                totalScore: Number(onChain.totalScore),
                count: Number(onChain.count),
                average: Number(onChain.average),
                lastUpdated: new Date(),
              },
            });
          }
        } catch { /* on-chain may not have data */ }
      }
    }

    return rep || { userId, totalScore: 0, count: 0, average: 0 };
  }

  static async triggerBookingReputation(bookingId: number) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: true, property: true },
    });
    if (!booking || booking.status !== 'COMPLETED') throw new Error('Booking must be completed');

    if (booking.review) {
      const tenantRep = await this.submitAttestation(
        booking.tenantId,
        booking.review.rating,
        booking.review.comment || 'Completed booking',
      );
      return { tenantRep };
    }
    return { message: 'No review to submit' };
  }
}
