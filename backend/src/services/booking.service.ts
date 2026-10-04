import { prisma } from '../config/database';
import { PropertyStatus } from '@prisma/client';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { DisputeService } from './dispute.service';

export class BookingService {
  static async create(tenantId: number, data: {
    propertyId: number;
    startDate: string;
    endDate: string;
    promoCode?: string;
  }) {
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });

    if (!property) throw new Error('Property not found');
    if (!property.isApproved) throw new Error('Property is not approved');
    if (property.status !== 'AVAILABLE') throw new Error('Property is not available');
    if (property.ownerId === tenantId) throw new Error('Cannot book your own property');

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (isNaN(startDate.getTime())) throw new Error('Invalid start date');
    if (isNaN(endDate.getTime())) throw new Error('Invalid end date');
    if (startDate >= endDate) throw new Error('End date must be after start date');
    if (startDate < new Date(new Date().toDateString())) throw new Error('Start date cannot be in the past');

    const existingBooking = await prisma.booking.findFirst({
      where: {
        propertyId: data.propertyId,
        status: { in: ['PENDING', 'LOCKED'] },
        AND: [
          { startDate: { lt: endDate } },
          { endDate: { gt: startDate } },
        ],
      },
    });
    if (existingBooking) throw new Error('Property is already booked for these dates');

    // Calculate total amount: deposit + (months * monthly rent)
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMonths = Math.max(1, Math.ceil(diffMs / (30 * 24 * 60 * 60 * 1000)));
    const deposit = parseFloat(property.depositEth || '0');
    const monthlyRent = parseFloat(property.priceEth || '0');
    const totalRent = monthlyRent * diffMonths;
    const totalAmount = (deposit + totalRent).toFixed(6);
    const remainingAmount = totalRent.toFixed(6);

    const booking = await prisma.booking.create({
      data: {
        tenantId,
        propertyId: data.propertyId,
        startDate,
        endDate,
        status: 'PENDING',
        totalAmount,
        remainingAmount,
      },
      include: { property: true },
    });

    await NotificationService.create(
      property.ownerId,
      'BOOKING_CREATED',
      `New booking request for "${property.title}"`,
      { bookingId: booking.id, propertyId: property.id }
    );

    // Send rich email to owner
    const tenant = await prisma.user.findUnique({ where: { id: tenantId }, select: { name: true, email: true } });
    EmailService.sendNewBookingToOwner(
      property.owner.email!,
      property.owner.name || 'Owner',
      {
        id: booking.id,
        tenantName: tenant?.name || 'Tenant',
        tenantEmail: tenant?.email || '',
        propertyTitle: property.title,
        startDate: startDate.toLocaleDateString(),
        endDate: endDate.toLocaleDateString(),
      }
    ).catch(e => console.error('Email sendNewBookingToOwner failed:', e.message));

    return {
      booking,
      contractParams: {
        propertyId: property.id,
        ownerAddress: null,
        depositAmount: property.depositEth,
        remainingAmount,
        totalAmount,
        timeoutDuration: 30 * 24 * 60 * 60,
      },
    };
  }

  static async getByUser(userId: number, role: string) {
    if (role === 'TENANT') {
      return prisma.booking.findMany({
        where: { tenantId: userId },
        include: {
          property: { include: { owner: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Owner - get bookings for their properties
    return prisma.booking.findMany({
      where: { property: { ownerId: userId } },
      include: {
        property: true,
        tenant: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getById(id: number, userId?: number, userRole?: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: { include: { owner: { select: { id: true, name: true, walletAddress: true } } } },
        tenant: { select: { id: true, name: true, email: true, walletAddress: true } },
        transactions: { orderBy: { createdAt: 'desc' } },
        review: true,
      },
    });
    if (!booking) throw new Error('Booking not found');
    if (userId && userRole !== 'ADMIN') {
      const isTenant = booking.tenantId === userId;
      const isOwner = booking.property.ownerId === userId;
      if (!isTenant && !isOwner) throw new Error('Not authorized to view this booking');
    }
    return booking;
  }

  static async updateTxHash(id: number, txHash: string, escrowAmount: string, userId?: number, blockchainBookingId?: number) {
    const booking = await prisma.booking.findUnique({ where: { id }, select: { tenantId: true, status: true } });
    if (!booking) throw new Error('Booking not found');
    if (userId && booking.tenantId !== userId) throw new Error('Not authorized to update this booking');
    if (!['PENDING', 'ACCEPTED'].includes(booking.status)) throw new Error('Booking must be in PENDING or ACCEPTED status to deposit');

    return prisma.booking.update({
      where: { id },
      data: {
        txHash,
        escrowAmount,
        blockchainBookingId,
        status: 'LOCKED',
        timeoutAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  static async payRemaining(id: number, userId: number, txHash: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!booking) throw new Error('Booking not found');
    if (booking.tenantId !== userId) throw new Error('Only the tenant can pay the remaining amount');
    if (booking.status !== 'LOCKED' && booking.status !== 'COMPLETED') throw new Error('Booking must be locked or completed to pay remaining');
    if (booking.remainingPaid) throw new Error('Remaining amount already paid');

    const [updated] = await prisma.$transaction([
      prisma.booking.update({
        where: { id },
        data: {
          remainingPaid: true,
          remainingTxHash: txHash,
          fullPaidAt: new Date(),
        },
      }),
      prisma.property.update({
        where: { id: booking.propertyId },
        data: { status: 'RENTED' as PropertyStatus },
      }),
    ]);
    return updated;
  }

  static async confirmHandover(id: number, userId: number) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!booking) throw new Error('Booking not found');
    if (booking.status !== 'LOCKED') throw new Error('Booking is not in locked state');

    const isTenant = booking.tenantId === userId;
    const isOwner = booking.property.ownerId === userId;

    if (!isTenant && !isOwner) throw new Error('Not authorized');

    const updateData: Record<string, unknown> = {};
    if (isTenant) updateData.tenantConfirmed = true;
    if (isOwner) updateData.ownerConfirmed = true;

    // Check if both have now confirmed
    const tenantConfirmed = isTenant ? true : booking.tenantConfirmed;
    const ownerConfirmed = isOwner ? true : booking.ownerConfirmed;

    if (tenantConfirmed && ownerConfirmed) {
      updateData.status = 'COMPLETED';
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: updateData,
    });

    // Notify the other party
    const notifyUserId = isTenant ? booking.property.ownerId : booking.tenantId;
    await NotificationService.create(
      notifyUserId,
      'HANDOVER_PENDING',
      `Booking confirmed by ${isTenant ? 'tenant' : 'owner'} for booking #${id}. Waiting for the other party to confirm.`,
      { bookingId: id }
    );

    if (updated.status === 'COMPLETED') {
      await NotificationService.create(
        booking.tenantId,
        'FUNDS_RELEASED',
        `Funds released for booking #${id}`,
        { bookingId: id }
      );
      await NotificationService.create(
        booking.property.ownerId,
        'FUNDS_RELEASED',
        `Funds received for booking #${id}`,
        { bookingId: id }
      );
      await prisma.property.update({
        where: { id: booking.propertyId },
        data: { status: 'BOOKED' },
      });
    }

    return updated;
  }

  static async accept(id: number, ownerId: number) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: { select: { ownerId: true, title: true, depositEth: true } },
        tenant: { select: { id: true, name: true, email: true } },
      },
    });

    if (!booking) throw new Error('Booking not found');
    if (booking.status !== 'PENDING') throw new Error('Only pending bookings can be accepted');
    if (booking.property.ownerId !== ownerId) throw new Error('Not authorized');

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'ACCEPTED' },
    });

    // Notify tenant
    await NotificationService.create(
      booking.tenantId,
      'BOOKING_ACCEPTED',
      `Your booking request for "${booking.property.title}" has been accepted! Proceed with deposit to secure it.`,
      { bookingId: id, propertyId: booking.propertyId }
    );

    // Send rich email to tenant
    EmailService.sendBookingAcceptedToTenant(
      booking.tenant.email!,
      booking.tenant.name || 'Tenant',
      {
        id: booking.id,
        propertyTitle: booking.property.title,
        startDate: booking.startDate.toLocaleDateString(),
        endDate: booking.endDate.toLocaleDateString(),
        depositEth: booking.property.depositEth?.toString() || '0',
      }
    ).catch(e => console.error('Email sendBookingAcceptedToTenant failed:', e.message));

    return updated;
  }

  static async reject(id: number, ownerId: number) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { property: { select: { ownerId: true, title: true } } },
    });

    if (!booking) throw new Error('Booking not found');
    if (booking.status !== 'PENDING') throw new Error('Only pending bookings can be rejected');
    if (booking.property.ownerId !== ownerId) throw new Error('Not authorized');

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    await prisma.property.update({
      where: { id: booking.propertyId },
      data: { status: 'AVAILABLE' },
    });

    // Notify tenant
    await NotificationService.create(
      booking.tenantId,
      'BOOKING_REJECTED',
      `Your booking request for "${booking.property.title}" has been rejected by the owner.`,
      { bookingId: id, propertyId: booking.propertyId }
    );

    return updated;
  }

  static async cancel(id: number, userId: number, userRole: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!booking) throw new Error('Booking not found');
    if (!['PENDING', 'LOCKED', 'COMPLETED'].includes(booking.status)) {
      throw new Error('Booking cannot be cancelled');
    }

    const isTenant = booking.tenantId === userId;
    const isOwner = booking.property.ownerId === userId;
    const isAdmin = userRole === 'ADMIN';

    if (!isTenant && !isOwner && !isAdmin) throw new Error('Not authorized');

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await prisma.property.update({
      where: { id: booking.propertyId },
      data: { status: 'AVAILABLE' },
    });

    return updated;
  }

  static async dispute(id: number, userId: number, reason?: string, againstUserId?: number) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!booking) throw new Error('Booking not found');
    if (booking.status !== 'LOCKED') throw new Error('Can only dispute locked bookings');
    if (booking.tenantId !== userId && booking.property.ownerId !== userId) {
      throw new Error('Not authorized');
    }

    // Determine the other party if not provided
    const against = againstUserId ?? (
      booking.tenantId === userId ? booking.property.ownerId : booking.tenantId
    );

    // Create the dispute record and update booking status
    const dispute = await DisputeService.raiseDispute(
      userId,
      id,
      against,
      reason || 'No reason provided'
    );

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'DISPUTED' },
    });

    return { ...updated, dispute };
  }

  static async cancelExpiredBookings() {
    const expired = await prisma.booking.findMany({
      where: {
        status: 'LOCKED',
        timeoutAt: { lte: new Date() },
      },
    });

    for (const booking of expired) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'REFUNDED' },
      });
      await prisma.property.update({
        where: { id: booking.propertyId },
        data: { status: 'AVAILABLE' },
      });
    }

    return { cancelled: expired.length };
  }

  static async sendTimeoutWarnings() {
    const warningWindow = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const expiring = await prisma.booking.findMany({
      where: {
        status: 'LOCKED',
        timeoutAt: { lte: warningWindow, gt: new Date() },
      },
      include: { tenant: true, property: { include: { owner: true } } },
    });

    for (const booking of expiring) {
      await NotificationService.create(
        booking.tenantId,
        'TIMEOUT_WARNING',
        `Your booking #${booking.id} will expire on ${booking.timeoutAt?.toLocaleDateString()}. Confirm handover to avoid cancellation.`,
        { bookingId: booking.id }
      );
      await NotificationService.create(
        booking.property.ownerId,
        'TIMEOUT_WARNING',
        `Booking #${booking.id} will expire on ${booking.timeoutAt?.toLocaleDateString()}. Confirm handover to receive funds.`,
        { bookingId: booking.id }
      );
    }

    return { warned: expiring.length };
  }

  static async modifyDates(id: number, userId: number, dates: { startDate: string; endDate: string }) {
    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) throw new Error('Booking not found');
    if (booking.tenantId !== userId) throw new Error('Not authorized');
    if (booking.status !== 'PENDING') throw new Error('Can only modify dates for pending bookings');

    const startDate = new Date(dates.startDate);
    const endDate = new Date(dates.endDate);

    if (isNaN(startDate.getTime())) throw new Error('Invalid start date');
    if (isNaN(endDate.getTime())) throw new Error('Invalid end date');
    if (startDate >= endDate) throw new Error('End date must be after start date');

    return prisma.booking.update({
      where: { id },
      data: { startDate, endDate },
    });
  }

  static async getAll(filters?: { status?: string; page?: number; limit?: number }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const where = filters?.status ? { status: filters.status as never } : {};

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          property: { select: { id: true, title: true, location: true } },
          tenant: { select: { id: true, name: true, email: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);

    return { bookings, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
