import { prisma } from '../config/database';

interface FraudRule {
  name: string;
  check: () => Promise<Array<{
    userId: number | null;
    severity: string;
    description: string;
    metadata: Record<string, unknown>;
  }>>;
}

export class FraudService {
  private static rules: FraudRule[] = [
    {
      name: 'rapid_bookings',
      check: async () => {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const results = await prisma.booking.groupBy({
          by: ['tenantId'],
          where: { createdAt: { gte: oneDayAgo } },
          _count: { id: true },
          having: { id: { _count: { gt: 5 } } },
        });

        return results.map(r => ({
          userId: r.tenantId,
          severity: 'high',
          description: `User created ${r._count.id} bookings in the last 24 hours`,
          metadata: { count: r._count.id },
        }));
      },
    },
    {
      name: 'rapid_cancellations',
      check: async () => {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const results = await prisma.booking.groupBy({
          by: ['tenantId'],
          where: {
            status: 'CANCELLED',
            updatedAt: { gte: oneWeekAgo },
          },
          _count: { id: true },
          having: { id: { _count: { gt: 3 } } },
        });

        return results.map(r => ({
          userId: r.tenantId,
          severity: 'medium',
          description: `User cancelled ${r._count.id} bookings in the last week`,
          metadata: { count: r._count.id },
        }));
      },
    },
    {
      name: 'quick_handover',
      check: async () => {
        const alerts: Array<{
          userId: number | null;
          severity: string;
          description: string;
          metadata: Record<string, unknown>;
        }> = [];

        const recentCompleted = await prisma.booking.findMany({
          where: {
            status: 'COMPLETED',
            updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
          include: { property: { select: { ownerId: true, title: true } } },
        });

        for (const booking of recentCompleted) {
          if (booking.timeoutAt) {
            const lockDuration = booking.updatedAt.getTime() -
              (booking.timeoutAt.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (lockDuration < 10 * 60 * 1000) { // < 10 minutes
              alerts.push({
                userId: booking.property.ownerId,
                severity: 'high',
                description: `Booking #${booking.id} completed within minutes of deposit`,
                metadata: { bookingId: booking.id, durationMs: lockDuration },
              });
            }
          }
        }

        return alerts;
      },
    },
    {
      name: 'duplicate_wallet',
      check: async () => {
        const duplicateWallets = await prisma.user.groupBy({
          by: ['walletAddress'],
          where: { walletAddress: { not: null } },
          _count: { id: true },
          having: { id: { _count: { gt: 1 } } },
        });

        return duplicateWallets.map(d => ({
          userId: null,
          severity: 'high',
          description: `Wallet address ${d.walletAddress} is linked to ${d._count.id} accounts`,
          metadata: { walletAddress: d.walletAddress, accountCount: d._count.id },
        }));
      },
    },
    {
      name: 'price_manipulation',
      check: async () => {
        const properties = await prisma.property.findMany({
          where: {
            updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        });

        const alerts: Array<{
          userId: number | null;
          severity: string;
          description: string;
          metadata: Record<string, unknown>;
        }> = [];

        for (const prop of properties) {
          const priceChanges = await prisma.property.findMany({
            where: {
              id: prop.id,
              updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
          });

          if (priceChanges.length > 3) {
            alerts.push({
              userId: prop.ownerId,
              severity: 'medium',
              description: `Property "${prop.title}" price changed ${priceChanges.length} times in a week`,
              metadata: { propertyId: prop.id, changes: priceChanges.length },
            });
          }
        }

        return alerts;
      },
    },
    {
      name: 'same_ip_multiple_accounts',
      check: async () => {
        // Requires IP tracking middleware on the auth/register endpoint
        // Without a request-scoped IP logger, this rule returns no results.
        // To implement: add a `lastIp` field to the User model and log IP on register/login.
        return [];
      },
    },
  ];

  static async runChecks() {
    const allAlerts: Array<{
      userId: number | null;
      alertType: string;
      severity: string;
      description: string;
      metadata: Record<string, unknown>;
    }> = [];

    for (const rule of this.rules) {
      const results = await rule.check();
      for (const result of results) {
        // Check if we already have an unresolved alert for this
        const existing = await prisma.fraudAlert.findFirst({
          where: {
            userId: result.userId,
            alertType: rule.name,
            isResolved: false,
          },
        });

        if (!existing) {
          await prisma.fraudAlert.create({
            data: {
              userId: result.userId,
              alertType: rule.name,
              severity: result.severity,
              description: result.description,
              metadata: result.metadata as any,
            },
          });

          allAlerts.push({ ...result, alertType: rule.name });
        }
      }
    }

    return allAlerts;
  }

  static async getAlerts(resolved = false) {
    return prisma.fraudAlert.findMany({
      where: { isResolved: resolved },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getStats() {
    const [total, unresolved, highSeverity, byType] = await Promise.all([
      prisma.fraudAlert.count(),
      prisma.fraudAlert.count({ where: { isResolved: false } }),
      prisma.fraudAlert.count({ where: { severity: 'high', isResolved: false } }),
      prisma.fraudAlert.groupBy({
        by: ['alertType'],
        _count: { id: true },
        where: { isResolved: false },
      }),
    ]);

    return {
      total,
      unresolved,
      highSeverity,
      byType: byType.map(t => ({ type: t.alertType, count: t._count.id })),
    };
  }

  static async resolveAlert(id: number) {
    return prisma.fraudAlert.update({
      where: { id },
      data: { isResolved: true },
    });
  }
}
