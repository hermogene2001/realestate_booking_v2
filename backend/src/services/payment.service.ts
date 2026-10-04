import { prisma } from '../config/database';
import { BlockchainService } from './blockchain.service';
import { TransactionService } from './transaction.service';
import { NotificationService } from './notification.service';
import { ExchangeRateClient } from './exchangeRate.service';
import { AuthService } from './auth.service';
import { env } from '../config/env';

export class PaymentService {
  static async convertCurrency(amount: number, from: string, to: string): Promise<number> {
    if (from === to) return amount;
    const rates = await ExchangeRateClient.getRates();
    const key = `${from}_${to}` as keyof typeof rates;
    if (rates[key] && typeof rates[key] === 'number') {
      return amount * (rates[key] as number);
    }
    // Convert through USD
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fromUSD = from === 'USD' ? amount : amount * ((rates as any)[`${from}_USD`] || 1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toAmount = to === 'USD' ? fromUSD : fromUSD * ((rates as any)[`USD_${to}`] || 1);
    return toAmount;
  }

  // MoMo Payment Integration
  static async initiateMoMoPayment(userId: number, bookingId: number, amount: number, phoneNumber: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.tenantId !== userId) {
      throw new Error('Booking not found');
    }

    if (booking.paymentStatus === 'COMPLETED') {
      throw new Error('Payment already completed');
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId,
        userId,
        amount,
        currency: 'RWF',
        paymentMethod: 'MOMO',
        status: 'PENDING',
        metadata: {
          phoneNumber,
        },
      },
    });

    // In production, integrate with actual MoMo API (MTN/Airtel)
    // This is a simulation
    const momoTransactionId = `MOMO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerRef: momoTransactionId,
        metadata: {
          phoneNumber,
          status: 'initiated',
        },
      },
    });

    return {
      paymentId: payment.id,
      transactionId: momoTransactionId,
      amount,
      phoneNumber,
      message: 'MoMo payment initiated. Check your phone for confirmation.',
    };
  }

  static async confirmMoMoPayment(paymentId: number, transactionRef: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            property: {
              include: { owner: { select: { walletAddress: true } } },
            },
          },
        },
      },
    });

    if (!payment) throw new Error('Payment not found');
    if (payment.status === 'COMPLETED') throw new Error('Payment already completed');

    try {
      // Mark fiat payment as completed
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'COMPLETED', transactionId: transactionRef, paidAt: new Date() },
      });

      // Submit escrow to blockchain on behalf of the user
      const booking = payment.booking;
      const ownerWallet = booking.property.owner?.walletAddress;
      let txHash = `momo-${transactionRef}`;
      let blockchainBookingId = '0';

      if (ownerWallet && await BlockchainService.isAvailable()) {
        try {
          const result = await BlockchainService.submitEscrow({
            propertyId: booking.propertyId,
            ownerAddress: ownerWallet,
            depositEth: booking.property.depositEth,
          });
          txHash = result.txHash;
          blockchainBookingId = result.blockchainBookingId;
        } catch (err) {
          console.error('[Blockchain] MoMo escrow submission failed:', err);
          // Continue — booking still gets locked even if blockchain fails
        }
      }

      // Lock the booking with the tx hash
      const bcId = parseInt(blockchainBookingId);
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          paymentStatus: 'COMPLETED',
          paymentMethod: 'MOMO',
          txHash,
          escrowAmount: booking.property.depositEth,
          blockchainBookingId: isNaN(bcId) ? null : bcId,
          status: 'LOCKED',
          timeoutAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // Record blockchain transaction
      await TransactionService.record({
        bookingId: payment.bookingId,
        txHash,
        type: 'DEPOSIT',
        amount: booking.property.depositEth,
        fromAddress: env.ADMIN_WALLET_ADDRESS,
        toAddress: env.CONTRACT_ADDRESS,
      });

      return {
        message: 'MoMo payment confirmed and escrow submitted to blockchain',
        txHash,
        blockchainBookingId,
      };
    } catch (err) {
      await NotificationService.create(payment.booking.tenantId, 'PAYMENT_FAILED', `MoMo payment failed for booking #${payment.bookingId}`, { bookingId: payment.bookingId });
      throw err;
    }
  }

  // Card Payment (Stripe/Flutterwave simulation)
  static async initiateCardPayment(userId: number, bookingId: number, amount: number, currency: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.tenantId !== userId) {
      throw new Error('Booking not found');
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        userId,
        amount,
        currency,
        paymentMethod: 'CARD',
        status: 'PENDING',
      },
    });

    // In production, integrate with Stripe/Flutterwave
    const stripePaymentIntentId = `pi_${Date.now}_${Math.random().toString(36).substr(2, 9)}`;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerRef: stripePaymentIntentId,
      },
    });

    return {
      paymentId: payment.id,
      clientSecret: stripePaymentIntentId,
      amount,
      currency,
    };
  }

  static async confirmCardPayment(paymentId: number) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            property: {
              include: { owner: { select: { walletAddress: true } } },
            },
          },
        },
      },
    });

    if (!payment) throw new Error('Payment not found');

    try {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'COMPLETED', paidAt: new Date() },
      });

      // Submit escrow to blockchain on behalf of the user
      const booking = payment.booking;
      const ownerWallet = booking.property.owner?.walletAddress;
      let txHash = `card-${payment.providerRef || paymentId}`;
      let blockchainBookingId = '0';

      if (ownerWallet && await BlockchainService.isAvailable()) {
        try {
          const result = await BlockchainService.submitEscrow({
            propertyId: booking.propertyId,
            ownerAddress: ownerWallet,
            depositEth: booking.property.depositEth,
          });
          txHash = result.txHash;
          blockchainBookingId = result.blockchainBookingId;
        } catch (err) {
          console.error('[Blockchain] Card escrow submission failed:', err);
        }
      }

      const bcId = parseInt(blockchainBookingId);
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          paymentStatus: 'COMPLETED',
          paymentMethod: 'CARD',
          txHash,
          escrowAmount: booking.property.depositEth,
          blockchainBookingId: isNaN(bcId) ? null : bcId,
          status: 'LOCKED',
          timeoutAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      await TransactionService.record({
        bookingId: payment.bookingId,
        txHash,
        type: 'DEPOSIT',
        amount: booking.property.depositEth,
        fromAddress: env.ADMIN_WALLET_ADDRESS,
        toAddress: env.CONTRACT_ADDRESS,
      });

      return {
        message: 'Card payment confirmed and escrow submitted to blockchain',
        txHash,
        blockchainBookingId,
      };
    } catch (err) {
      await NotificationService.create(payment.booking.tenantId, 'PAYMENT_FAILED', `Card payment failed for booking #${payment.bookingId}`, { bookingId: payment.bookingId });
      throw err;
    }
  }

  // Ethereum Payment (existing blockchain)
  static async confirmEthereumPayment(bookingId: number, txHash: string, amount: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        userId: booking.tenantId,
        amount: parseFloat(amount),
        currency: 'ETH',
        paymentMethod: 'ETHEREUM',
        status: 'COMPLETED',
        transactionId: txHash,
        paidAt: new Date(),
      },
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: 'COMPLETED',
        paymentMethod: 'ETHEREUM',
      },
    });

    return payment;
  }

  // Manual ETH payment (uses admin wallet to submit escrow — no MetaMask needed)
  static async manualEthPayment(userId: number, bookingId: number, walletAddress?: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: {
          include: { owner: { select: { walletAddress: true } } },
        },
      },
    });

    if (!booking || booking.tenantId !== userId) {
      throw new Error('Booking not found');
    }
    if (booking.status !== 'PENDING') {
      throw new Error('Booking is not in PENDING status');
    }

    // Save wallet address if provided
    if (walletAddress) {
      await AuthService.linkWallet(userId, walletAddress);
    }

    const ownerWallet = booking.property.owner?.walletAddress;
    if (!ownerWallet) {
      throw new Error('Property owner has not linked their wallet. Try MoMo or Card instead.');
    }

    // Submit escrow to blockchain using admin wallet
    let txHash = '';
    let blockchainBookingId = '0';
    try {
      const result = await BlockchainService.submitEscrow({
        propertyId: booking.propertyId,
        ownerAddress: ownerWallet,
        depositEth: booking.property.depositEth,
      });
      txHash = result.txHash;
      blockchainBookingId = result.blockchainBookingId;
    } catch (err) {
      console.error('[Payment] Manual ETH escrow submission failed:', err);
      throw new Error('Blockchain escrow submission failed. Check that the Hardhat node is running.');
    }

    const bcId = parseInt(blockchainBookingId);
    // Lock the booking
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        txHash,
        escrowAmount: booking.property.depositEth,
        blockchainBookingId: isNaN(bcId) ? null : bcId,
        status: 'LOCKED',
        paymentMethod: 'ETHEREUM',
        paymentStatus: 'COMPLETED',
        timeoutAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Record transaction
    await TransactionService.record({
      bookingId,
      txHash,
      type: 'DEPOSIT',
      amount: booking.property.depositEth,
      fromAddress: walletAddress || env.ADMIN_WALLET_ADDRESS,
      toAddress: env.CONTRACT_ADDRESS,
    });

    return {
      message: 'Booking confirmed! Escrow submitted to blockchain.',
      txHash,
      bookingId,
    };
  }

  // Pay remaining amount via admin wallet (no MetaMask needed)
  static async payRemainingEth(userId: number, bookingId: number) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: {
          include: { owner: { select: { walletAddress: true } } },
        },
      },
    });

    if (!booking || booking.tenantId !== userId) {
      throw new Error('Booking not found');
    }
    if (booking.status !== 'LOCKED' && booking.status !== 'COMPLETED') {
      throw new Error('Booking must be locked or completed to pay remaining');
    }
    if (booking.remainingPaid) {
      throw new Error('Remaining amount already paid');
    }
    if (!booking.remainingAmount) {
      throw new Error('No remaining amount to pay');
    }

    const ownerWallet = booking.property.owner?.walletAddress;
    if (!ownerWallet) {
      throw new Error('Property owner has not linked their wallet');
    }

    // Send remaining ETH from admin wallet to owner
    const { txHash } = await BlockchainService.payRemainingForUser({
      ownerAddress: ownerWallet,
      amountEth: booking.remainingAmount,
    });

    // Update booking + mark property as RENTED
    const [updated] = await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: {
          remainingPaid: true,
          remainingTxHash: txHash,
          fullPaidAt: new Date(),
        },
      }),
      prisma.property.update({
        where: { id: booking.propertyId },
        data: { status: 'RENTED' },
      }),
    ]);

    // Record transaction
    await TransactionService.record({
      bookingId,
      txHash,
      type: 'REMAINING' as never,
      amount: booking.remainingAmount,
      fromAddress: env.ADMIN_WALLET_ADDRESS,
      toAddress: ownerWallet,
    });

    return { txHash, booking: updated };
  }

  // Payment queries
  static async getUserPayments(userId: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { userId },
        include: {
          booking: {
            select: {
              id: true,
              property: {
                select: {
                  title: true,
                  images: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where: { userId } }),
    ]);

    return { payments, total, page, totalPages: Math.ceil(total / limit) };
  }

  static async getPaymentStats(userId: number) {
    const [total, completed, pending, totalAmount] = await Promise.all([
      prisma.payment.count({ where: { userId } }),
      prisma.payment.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.payment.count({ where: { userId, status: 'PENDING' } }),
      prisma.payment.aggregate({
        where: { userId, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    return {
      total,
      completed,
      pending,
      totalAmount: totalAmount._sum.amount || 0,
    };
  }

  static async refundPayment(bookingId: number) {
    const payment = await prisma.payment.findUnique({
      where: { bookingId },
    });

    if (!payment) {
      throw new Error('Payment not found for this booking');
    }

    if (payment.status !== 'COMPLETED') {
      throw new Error('Can only refund completed payments');
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED', refundedAt: new Date() },
    });

    return { message: 'Payment refunded successfully', refundedAmount: payment.amount, currency: payment.currency };
  }
}
