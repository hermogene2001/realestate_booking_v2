import { prisma } from '../config/database';
import { EmailService } from './email.service';

const EMAIL_TYPES: Record<string, { subject: string; template: 'booking' | 'payment' | 'kyc' | 'welcome' }> = {
  BOOKING_CREATED: { subject: 'Booking Created', template: 'booking' },
  DEPOSIT_CONFIRMED: { subject: 'Deposit Confirmed', template: 'payment' },
  FUNDS_RELEASED: { subject: 'Funds Released to Owner', template: 'payment' },
  KYC_APPROVED: { subject: 'KYC Approved', template: 'kyc' },
  KYC_REJECTED: { subject: 'KYC Rejected', template: 'kyc' },
};

export class NotificationService {
  static async create(
    userId: number,
    type: string,
    message: string,
    metadata?: Record<string, unknown>
  ) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: type as never,
        message,
        metadata: (metadata || undefined) as any,
      },
    });

    // Send email for important notifications
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.email && EMAIL_TYPES[type]) {
        EmailService.sendEmail(user.email, EMAIL_TYPES[type].subject, `<p>${message}</p>`).catch(e => console.error('Notification email failed:', e.message));
      }
    } catch (e) {
      console.error('Notification email error:', e instanceof Error ? e.message : e);
    }

    return notification;
  }

  static async getByUser(userId: number, unreadOnly = false, page = 1, limit = 20) {
    const where = {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { notifications, total, unreadCount, page, limit };
  }

  static async markRead(id: number, userId: number) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  static async markAllRead(userId: number) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return result.count;
  }
}
