import { prisma } from '../config/database';

export class CommissionService {
  private static DEFAULT_COMMISSION_RATE = 5; // 5%

  static async calculateCommission(bookingId: number) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: true },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    const totalAmount = parseFloat(booking.escrowAmount || '0');
    const commissionRate = this.DEFAULT_COMMISSION_RATE;
    const platformFee = totalAmount * (commissionRate / 100);
    const ownerReceives = totalAmount - platformFee;

    return {
      bookingId,
      propertyId: booking.propertyId,
      ownerId: booking.property.ownerId,
      totalAmount,
      commissionRate,
      platformFee,
      ownerReceives,
    };
  }

  static async createCommission(bookingId: number) {
    const existing = await prisma.commission.findUnique({
      where: { bookingId },
    });

    if (existing) {
      throw new Error('Commission already exists for this booking');
    }

    const calculation = await this.calculateCommission(bookingId);

    const commission = await prisma.commission.create({
      data: {
        bookingId: calculation.bookingId,
        propertyId: calculation.propertyId,
        ownerId: calculation.ownerId,
        platformFee: calculation.platformFee,
        ownerReceives: calculation.ownerReceives,
        totalAmount: calculation.totalAmount,
        commissionRate: calculation.commissionRate,
      },
    });

    return commission;
  }

  static async getOwnerCommissions(ownerId: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [commissions, total, stats] = await Promise.all([
      prisma.commission.findMany({
        where: { ownerId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.commission.count({ where: { ownerId } }),
      prisma.commission.aggregate({
        where: { ownerId },
        _sum: {
          platformFee: true,
          ownerReceives: true,
          totalAmount: true,
        },
        _count: true,
      }),
    ]);

    return {
      commissions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalEarnings: stats._sum.ownerReceives || 0,
        totalFees: stats._sum.platformFee || 0,
        totalBookings: stats._count,
      },
    };
  }

  static async getPlatformStats() {
    const stats = await prisma.commission.aggregate({
      _sum: {
        platformFee: true,
        ownerReceives: true,
        totalAmount: true,
      },
      _count: true,
    });

    const byStatus = await prisma.commission.groupBy({
      by: ['status'],
      _count: true,
      _sum: {
        platformFee: true,
      },
    });

    return {
      totalRevenue: stats._sum.platformFee || 0,
      totalVolume: stats._sum.totalAmount || 0,
      totalBookings: stats._count,
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: s._count,
        revenue: s._sum.platformFee || 0,
      })),
    };
  }

  static async markAsPaid(commissionId: number) {
    const commission = await prisma.commission.findUnique({
      where: { id: commissionId },
    });

    if (!commission) {
      throw new Error('Commission not found');
    }

    if (commission.status === 'PAID') {
      throw new Error('Commission already paid');
    }

    const updated = await prisma.commission.update({
      where: { id: commissionId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    return updated;
  }

  static async getCommissionRate() {
    return { rate: this.DEFAULT_COMMISSION_RATE };
  }
}
