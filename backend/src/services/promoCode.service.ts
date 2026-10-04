import { prisma } from '../config/database';

export class PromoCodeService {
  static async createPromoCode(data: {
    code: string;
    description?: string;
    discountPercent?: number;
    discountAmount?: number;
    maxUses?: number;
    validUntil?: Date;
  }) {
    // Validate
    if (!data.discountPercent && !data.discountAmount) {
      throw new Error('Either discountPercent or discountAmount must be provided');
    }

    const promoCode = await prisma.promoCode.create({
      data: {
        code: data.code.toUpperCase(),
        description: data.description,
        discountPercent: data.discountPercent || 0,
        discountAmount: data.discountAmount || 0,
        maxUses: data.maxUses || 0,
        validUntil: data.validUntil,
      },
    });

    return promoCode;
  }

  static async validatePromoCode(code: string, bookingAmount: number) {
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promoCode) {
      throw new Error('Invalid promo code');
    }

    if (!promoCode.isActive) {
      throw new Error('Promo code is not active');
    }

    const now = new Date();
    if (promoCode.validUntil && now > promoCode.validUntil) {
      throw new Error('Promo code has expired');
    }

    if (now < promoCode.validFrom) {
      throw new Error('Promo code is not yet valid');
    }

    if (promoCode.maxUses > 0 && promoCode.usedCount >= promoCode.maxUses) {
      throw new Error('Promo code has reached maximum uses');
    }

    // Calculate discount
    let discount = 0;
    if (promoCode.discountPercent > 0) {
      discount = bookingAmount * (promoCode.discountPercent / 100);
    } else if (promoCode.discountAmount > 0) {
      discount = promoCode.discountAmount;
    }

    // Ensure discount doesn't exceed booking amount
    discount = Math.min(discount, bookingAmount);

    return {
      promoCode,
      discount,
      finalAmount: bookingAmount - discount,
    };
  }

  static async usePromoCode(code: string) {
    await prisma.promoCode.update({
      where: { code: code.toUpperCase() },
      data: {
        usedCount: {
          increment: 1,
        },
      },
    });
  }

  static async getPromoCode(code: string) {
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promoCode) {
      throw new Error('Promo code not found');
    }

    return promoCode;
  }

  static async getAllPromoCodes(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [promoCodes, total] = await Promise.all([
      prisma.promoCode.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.promoCode.count(),
    ]);

    return {
      promoCodes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async updatePromoCode(id: number, data: {
    description?: string;
    discountPercent?: number;
    discountAmount?: number;
    maxUses?: number;
    validUntil?: Date;
    isActive?: boolean;
  }) {
    const promoCode = await prisma.promoCode.update({
      where: { id },
      data,
    });

    return promoCode;
  }

  static async deletePromoCode(id: number) {
    await prisma.promoCode.delete({
      where: { id },
    });

    return { message: 'Promo code deleted' };
  }

  static async getPromoCodeStats() {
    const [total, active, totalUses] = await Promise.all([
      prisma.promoCode.count(),
      prisma.promoCode.count({ where: { isActive: true } }),
      prisma.promoCode.aggregate({
        _sum: {
          usedCount: true,
        },
      }),
    ]);

    return {
      total,
      active,
      totalUses: totalUses._sum.usedCount || 0,
    };
  }
}
