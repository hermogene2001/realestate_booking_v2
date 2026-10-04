import { prisma } from '../config/database';

export class InsuranceService {
  static async createInsurance(data: {
    bookingId: number;
    provider: string;
    policyNumber: string;
    coverageAmount: number;
    premium: number;
    validFrom: Date;
    validUntil: Date;
  }) {
    const insurance = await prisma.insurance.create({
      data,
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
      },
    });

    return insurance;
  }

  static async getInsurance(bookingId: number) {
    const insurance = await prisma.insurance.findUnique({
      where: { bookingId },
      include: {
        booking: {
          include: {
            property: true,
          },
        },
      },
    });

    return insurance;
  }

  static async cancelInsurance(bookingId: number) {
    const insurance = await prisma.insurance.update({
      where: { bookingId },
      data: {
        status: 'CANCELLED',
      },
    });

    return insurance;
  }

  static async getActiveInsurances() {
    const insurances = await prisma.insurance.findMany({
      where: {
        status: 'ACTIVE',
        validUntil: {
          gte: new Date(),
        },
      },
      include: {
        booking: {
          include: {
            property: {
              select: { title: true },
            },
            tenant: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    return insurances;
  }
}

export class RewardTokenService {
  static async earnTokens(userId: number, amount: number, description: string, bookingId?: number) {
    const token = await prisma.rewardToken.create({
      data: {
        userId,
        amount,
        type: 'EARNING',
        description,
        bookingId,
      },
    });

    return token;
  }

  static async redeemTokens(userId: number, amount: number, description: string) {
    const balance = await this.getBalance(userId);

    if (balance < amount) {
      throw new Error('Insufficient token balance');
    }

    const token = await prisma.rewardToken.create({
      data: {
        userId,
        amount: -amount,
        type: 'REDEMPTION',
        description,
      },
    });

    return token;
  }

  static async getBalance(userId: number) {
    const result = await prisma.rewardToken.aggregate({
      where: { userId },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount || 0;
  }

  static async getHistory(userId: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [tokens, total] = await Promise.all([
      prisma.rewardToken.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.rewardToken.count({
        where: { userId },
      }),
    ]);

    return {
      tokens,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async awardBookingBonus(userId: number, bookingId: number, bookingAmount: number) {
    const bonusTokens = bookingAmount * 0.01; // 1% of booking amount as tokens
    
    await this.earnTokens(
      userId,
      bonusTokens,
      `Booking bonus: ${bookingAmount} ETH`,
      bookingId
    );

    return bonusTokens;
  }
}

export class AgentService {
  static async createAgent(userId: number, data: {
    licenseNumber: string;
    agency?: string;
    specialty?: string;
  }) {
    const agent = await prisma.agent.create({
      data: {
        userId,
        ...data,
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

    return agent;
  }

  static async verifyAgent(agentId: number) {
    const agent = await prisma.agent.update({
      where: { id: agentId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    });

    return agent;
  }

  static async getAgent(userId: number) {
    const agent = await prisma.agent.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });

    return agent;
  }

  static async getAllAgents(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { rating: 'desc' },
        skip,
        take: limit,
      }),
      prisma.agent.count(),
    ]);

    return {
      agents,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async updateAgentRating(agentId: number, rating: number) {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    const newRating = ((agent.rating * agent.totalSales) + rating) / (agent.totalSales + 1);

    const updated = await prisma.agent.update({
      where: { id: agentId },
      data: {
        rating: newRating,
        totalSales: {
          increment: 1,
        },
      },
    });

    return updated;
  }
}
