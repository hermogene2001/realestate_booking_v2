import { prisma } from '../config/database';

export class KYCService {
  static async submitVerification(
    userId: number,
    data: {
      idDocFront: string;
      idDocBack: string;
      selfie?: string;
    }
  ) {
    // Check if user already has a verification
    const existing = await prisma.verification.findUnique({
      where: { userId },
    });

    if (existing) {
      if (existing.status === 'APPROVED') {
        throw new Error('Your identity is already verified');
      }
      if (existing.status === 'PENDING') {
        throw new Error('Your verification is still under review');
      }
      // If REJECTED, allow resubmission by updating
      return this.updateVerification(existing.id, data);
    }

    const verification = await prisma.verification.create({
      data: {
        userId,
        idDocFront: data.idDocFront,
        idDocBack: data.idDocBack,
        selfie: data.selfie || null,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return verification;
  }

  static async updateVerification(
    verificationId: number,
    data: {
      idDocFront?: string;
      idDocBack?: string;
      selfie?: string;
    }
  ) {
    const verification = await prisma.verification.update({
      where: { id: verificationId },
      data: {
        ...data,
        status: 'PENDING', // Reset to pending on resubmission
        rejectionReason: null,
        verifiedAt: null,
      },
    });

    return verification;
  }

  static async getVerificationStatus(userId: number) {
    const verification = await prisma.verification.findUnique({
      where: { userId },
    });

    return verification;
  }

  static async getAllVerifications(filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, page = 1, limit = 20 } = filters || {};

    const where = status ? { status } : {};

    const [verifications, total] = await Promise.all([
      prisma.verification.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              walletAddress: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.verification.count({ where }),
    ]);

    return {
      verifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async reviewVerification(
    verificationId: number,
    reviewerId: number,
    decision: 'APPROVED' | 'REJECTED',
    rejectionReason?: string
  ) {
    if (decision === 'REJECTED' && !rejectionReason) {
      throw new Error('Rejection reason is required');
    }

    const verification = await prisma.verification.update({
      where: { id: verificationId },
      data: {
        status: decision,
        reviewedBy: reviewerId,
        verifiedAt: decision === 'APPROVED' ? new Date() : null,
        rejectionReason: decision === 'REJECTED' ? rejectionReason : null,
      },
      include: {
        user: true,
      },
    });

    // Update user's verification status
    if (decision === 'APPROVED') {
      await prisma.user.update({
        where: { id: verification.userId },
        data: { isVerified: true },
      });

      // Create notification for user
      await prisma.notification.create({
        data: {
          userId: verification.userId,
          type: 'KYC_APPROVED',
          message: 'Your identity verification has been approved! You can now enjoy all platform features.',
        },
      });
    } else {
      await prisma.notification.create({
        data: {
          userId: verification.userId,
          type: 'KYC_REJECTED',
          message: `Your identity verification was rejected: ${rejectionReason}`,
        },
      });
    }

    return verification;
  }

  static async deleteVerification(userId: number) {
    await prisma.verification.delete({
      where: { userId },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: false },
    });
  }
}
