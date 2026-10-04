import { prisma } from '../config/database';

export class AnalyticsService {
  static async getOverview() {
    const [totalUsers, totalProperties, totalBookings, payments, bookings] = await Promise.all([
      prisma.user.count(),
      prisma.property.count(),
      prisma.booking.count(),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.booking.findMany({
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const monthlyMap = new Map<string, number>();
    bookings.forEach((booking) => {
      const month = booking.createdAt.toISOString().slice(0, 7);
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + 1);
    });

    return {
      totalUsers,
      totalProperties,
      totalBookings,
      totalRevenue: payments._sum.amount ?? 0,
      monthlyStats: [...monthlyMap.entries()]
        .map(([month, count]) => ({ month, bookings: count }))
        .slice(0, 12),
    };
  }

  static async getUserStats() {
    const [total, activeLast30Days, kycVerified, twoFactorEnabled, byRole] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 86400000) } } }),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.user.count({ where: { twoFactorEnabled: true } }),
      prisma.user.groupBy({ by: ['role'], _count: true }),
    ]);
    const roleMap: Record<string, number> = {};
    byRole.forEach(r => { roleMap[r.role] = r._count; });
    return { total, activeLast30Days, kycVerified, twoFactorEnabled, byRole: roleMap };
  }

  static async getPropertyStats() {
    const [total, byStatus, avgStats] = await Promise.all([
      prisma.property.count(),
      prisma.property.groupBy({ by: ['status'], _count: true }),
      prisma.property.aggregate({ _avg: { bedrooms: true, bathrooms: true, area: true } }),
    ]);
    const statusMap: Record<string, number> = {};
    byStatus.forEach(s => { statusMap[s.status] = s._count; });
    return { total, byStatus: statusMap, avgStats };
  }

  static async getBookingStats() {
    const [total, byStatus] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.groupBy({ by: ['status'], _count: true }),
    ]);
    const statusMap: Record<string, number> = {};
    byStatus.forEach(b => { statusMap[b.status] = b._count; });
    return { total, byStatus: statusMap };
  }

  static async getFraudStats() {
    const [totalAlerts, resolved, unresolved] = await Promise.all([
      prisma.fraudAlert.count(),
      prisma.fraudAlert.count({ where: { isResolved: true } }),
      prisma.fraudAlert.count({ where: { isResolved: false } }),
    ]);
    return {
      totalAlerts,
      resolved,
      unresolved,
      resolveRate: totalAlerts > 0 ? Math.round((resolved / totalAlerts) * 100) : 0,
    };
  }
}
