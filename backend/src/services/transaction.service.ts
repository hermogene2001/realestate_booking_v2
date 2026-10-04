import { prisma } from '../config/database';

export class TransactionService {
  static async record(data: {
    bookingId: number;
    txHash: string;
    type: string;
    amount: string;
    fromAddress: string;
    toAddress: string;
    status?: string;
  }) {
    return prisma.transaction.create({
      data: {
        bookingId: data.bookingId,
        txHash: data.txHash,
        type: data.type as never,
        amount: data.amount,
        fromAddress: data.fromAddress,
        toAddress: data.toAddress,
        status: (data.status as never) || 'CONFIRMED',
      },
    });
  }

  static async getByBooking(bookingId: number) {
    return prisma.transaction.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getByHash(txHash: string) {
    return prisma.transaction.findUnique({ where: { txHash } });
  }

  static async getAll(page = 1, limit = 20) {
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        include: {
          booking: {
            select: { id: true, property: { select: { title: true } } },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.count(),
    ]);

    return { transactions, total, page, limit };
  }
}
