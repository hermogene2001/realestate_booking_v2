import { prisma } from '../config/database';
import { NotificationService } from './notification.service';

export class DisputeService {
  static async raiseDispute(
    userId: number,
    bookingId: number,
    againstUserId: number,
    reason: string
  ) {
    // Check if dispute already exists for this booking
    const existing = await prisma.dispute.findUnique({
      where: { bookingId },
    });

    if (existing) {
      throw new Error('Dispute already exists for this booking');
    }

    const dispute = await prisma.dispute.create({
      data: {
        bookingId,
        raisedBy: userId,
        against: againstUserId,
        reason,
      },
      include: {
        booking: {
          include: {
            property: {
              select: {
                title: true,
              },
            },
          },
        },
        raisedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        againstUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return dispute;
  }

  static async getDispute(disputeId: number) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        booking: {
          include: {
            property: true,
            tenant: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        raisedByUser: {
          select: { id: true, name: true, email: true },
        },
        againstUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!dispute) {
      throw new Error('Dispute not found');
    }

    return dispute;
  }

  static async getUserDisputes(userId: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where: {
          OR: [
            { raisedBy: userId },
            { against: userId },
          ],
        },
        include: {
          booking: {
            include: {
              property: {
                select: { title: true, images: true },
              },
            },
          },
          raisedByUser: {
            select: { id: true, name: true },
          },
          againstUser: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.dispute.count({
        where: {
          OR: [
            { raisedBy: userId },
            { against: userId },
          ],
        },
      }),
    ]);

    return {
      disputes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getAllDisputes(status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        include: {
          booking: {
            include: {
              property: {
                select: { title: true },
              },
            },
          },
          raisedByUser: {
            select: { id: true, name: true, email: true },
          },
          againstUser: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.dispute.count({ where }),
    ]);

    return {
      disputes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async resolveDispute(
    disputeId: number,
    adminId: number,
    resolution: string,
    status: 'RESOLVED' | 'REJECTED' = 'RESOLVED'
  ) {
    const dispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status,
        resolution,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
      include: {
        booking: true,
        raisedByUser: {
          select: { id: true, name: true, email: true },
        },
        againstUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await NotificationService.create(
      dispute.raisedBy,
      'DISPUTE_RESOLVED',
      `Your dispute for booking #${dispute.bookingId} has been ${status.toLowerCase()}`,
      { disputeId: disputeId, bookingId: dispute.bookingId, status }
    );
    await NotificationService.create(
      dispute.against,
      'DISPUTE_RESOLVED',
      `A dispute against you for booking #${dispute.bookingId} has been ${status.toLowerCase()}`,
      { disputeId: disputeId, bookingId: dispute.bookingId, status }
    );

    return dispute;
  }

  static async getDisputeStats() {
    const [total, open, resolved, rejected, thisMonth] = await Promise.all([
      prisma.dispute.count(),
      prisma.dispute.count({ where: { status: 'OPEN' } }),
      prisma.dispute.count({ where: { status: 'RESOLVED' } }),
      prisma.dispute.count({ where: { status: 'REJECTED' } }),
      prisma.dispute.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return {
      total,
      open,
      resolved,
      rejected,
      thisMonth,
      resolutionRate: total > 0 ? ((resolved / total) * 100).toFixed(2) : '0',
    };
  }
}
