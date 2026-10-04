import { Router, Response } from 'express';
import path from 'path';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { BookingService } from '../services/booking.service';
import { TransactionService } from '../services/transaction.service';
import { PropertyService } from '../services/property.service';
import { FraudService } from '../services/fraud.service';
import { DisputeService } from '../services/dispute.service';
import { CommissionService } from '../services/commission.service';
import { PromoCodeService } from '../services/promoCode.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();

// All admin routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

// Stats overview
router.get('/stats', async (_req: AuthRequest, res: Response) => {
  try {
    const [totalUsers, totalProperties, totalBookings, totalTransactions, activeDisputes, escrowTxs] =
      await Promise.all([
        prisma.user.count(),
        prisma.property.count(),
        prisma.booking.count(),
        prisma.transaction.count(),
        prisma.booking.count({ where: { status: 'DISPUTED' } }),
        prisma.transaction.findMany({
          where: { type: 'DEPOSIT', status: 'CONFIRMED' },
          select: { amount: true },
        }),
      ]);

    const escrowVolume = escrowTxs.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0);

    res.json({
      totalUsers,
      totalProperties,
      totalBookings,
      totalTransactions,
      activeDisputes,
      escrowVolume: escrowVolume.toFixed(4),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch stats';
    res.status(500).json({ error: message });
  }
});

// User management
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const role = req.query.role as string;
    const search = req.query.search as string;
    const banned = req.query.banned as string;

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (banned !== undefined) where.isBanned = banned === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, phone: true,
          role: true, language: true, walletAddress: true,
          isBanned: true, createdAt: true,
          _count: { select: { bookings: true, properties: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page, limit });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch users';
    res.status(500).json({ error: message });
  }
});

// Ban/unban user
router.patch('/users/:id/ban', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { isBanned: req.body.isBanned },
    });
    res.json({ user: { id: user.id, name: user.name, isBanned: user.isBanned } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update user';
    res.status(400).json({ error: message });
  }
});

// Change user role
router.patch('/users/:id/role', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { role: req.body.role },
    });
    res.json({ user: { id: user.id, name: user.name, role: user.role } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update role';
    res.status(400).json({ error: message });
  }
});

// All bookings
router.get('/bookings', async (req: AuthRequest, res: Response) => {
  try {
    const result = await BookingService.getAll({
      status: req.query.status as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    });
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch bookings';
    res.status(500).json({ error: message });
  }
});

// All transactions
router.get('/transactions', async (req: AuthRequest, res: Response) => {
  try {
    const result = await TransactionService.getAll(
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 20
    );
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch transactions';
    res.status(500).json({ error: message });
  }
});

// Pending properties
router.get('/properties/pending', async (_req: AuthRequest, res: Response) => {
  try {
    const properties = await prisma.property.findMany({
      where: { isApproved: false },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        propertyDocuments: {
          select: {
            id: true,
            documentType: true,
            fileName: true,
            filePath: true,
            mimeType: true,
            status: true,
            rejectionReason: true,
            uploadedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const uploadDir = path.resolve(env.UPLOAD_DIR);
    const result = properties.map(p => ({
      ...p,
      propertyDocuments: p.propertyDocuments.map(d => ({
        ...d,
        fileUrl: `/uploads/${path.relative(uploadDir, d.filePath).replace(/\\/g, '/')}`,
      })),
    }));

    res.json({ properties: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch properties';
    res.status(500).json({ error: message });
  }
});

// All properties with status
router.get('/properties/status', async (req: AuthRequest, res: Response) => {
  try {
    const { status, isApproved, search, page, limit } = req.query;
    const result = await PropertyService.getAllWithStatus({
      status: status as string | undefined,
      isApproved: isApproved as string | undefined,
      search: search as string | undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch properties';
    res.status(500).json({ error: message });
  }
});

// Fraud stats
router.get('/fraud-alerts/stats', async (_req: AuthRequest, res: Response) => {
  try {
    const stats = await FraudService.getStats();
    res.json(stats);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch fraud stats';
    res.status(500).json({ error: message });
  }
});

// Trigger fraud scan manually
router.post('/fraud-alerts/scan', async (_req: AuthRequest, res: Response) => {
  try {
    const alerts = await FraudService.runChecks();
    res.json({ alerts, message: `Scan complete. ${alerts.length} new alert(s) detected.` });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Fraud scan failed';
    res.status(500).json({ error: message });
  }
});

// Fraud alerts
router.get('/fraud-alerts', async (req: AuthRequest, res: Response) => {
  try {
    const resolved = req.query.resolved === 'true';
    const alerts = await FraudService.getAlerts(resolved);
    res.json({ alerts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch alerts';
    res.status(500).json({ error: message });
  }
});

// Resolve fraud alert
router.patch('/fraud-alerts/:id', async (req: AuthRequest, res: Response) => {
  try {
    const alert = await FraudService.resolveAlert(parseInt(req.params.id));
    res.json({ alert });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to resolve alert';
    res.status(400).json({ error: message });
  }
});

// ─── Reviews ─────────────────────────────────────────────────────────────────

router.get('/reviews', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          property: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count(),
    ]);
    res.json({ reviews, total, page });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.delete('/reviews/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.review.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Review deleted' });
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
});

// ─── Disputes ────────────────────────────────────────────────────────────────

router.get('/disputes', async (req: AuthRequest, res: Response) => {
  try {
    const result = await DisputeService.getAllDisputes(
      req.query.status as string,
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 20
    );
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.get('/disputes/stats', async (_req: AuthRequest, res: Response) => {
  try {
    const stats = await DisputeService.getDisputeStats();
    res.json(stats);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.patch('/disputes/:id/resolve', async (req: AuthRequest, res: Response) => {
  try {
    const dispute = await DisputeService.resolveDispute(
      parseInt(req.params.id),
      req.userId!,
      req.body.resolution,
      req.body.status || 'RESOLVED'
    );
    res.json({ dispute });
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
});

// ─── Payments ────────────────────────────────────────────────────────────────

router.get('/payments', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          booking: { include: { property: { select: { title: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count(),
    ]);
    const stats = await prisma.payment.aggregate({
      _sum: { amount: true },
      _count: true,
    });
    res.json({ payments, total, page, totalAmount: stats._sum.amount || 0 });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
});

// ─── Commissions ─────────────────────────────────────────────────────────────

router.get('/commissions', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const [rawCommissions, total] = await Promise.all([
      prisma.commission.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.commission.count(),
    ]);

    const ownerIds = [...new Set(rawCommissions.map(c => c.ownerId))];
    const propertyIds = [...new Set(rawCommissions.map(c => c.propertyId))];
    const [owners, properties] = await Promise.all([
      prisma.user.findMany({ where: { id: { in: ownerIds } }, select: { id: true, name: true, email: true } }),
      prisma.property.findMany({ where: { id: { in: propertyIds } }, select: { id: true, title: true } }),
    ]);
    const ownerMap = new Map(owners.map(o => [o.id, o]));
    const propertyMap = new Map(properties.map(p => [p.id, p]));

    const commissions = rawCommissions.map(c => ({
      ...c,
      booking: c.bookingId ? { property: propertyMap.get(c.propertyId) || null } : null,
      owner: ownerMap.get(c.ownerId) || null,
    }));

    const platformStats = await CommissionService.getPlatformStats();
    res.json({ commissions, total, page, platformStats });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.patch('/commissions/:id/pay', async (req: AuthRequest, res: Response) => {
  try {
    const commission = await CommissionService.markAsPaid(parseInt(req.params.id));
    res.json({ commission });
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
});

// ─── Promo Codes ─────────────────────────────────────────────────────────────

router.get('/promo-codes', async (req: AuthRequest, res: Response) => {
  try {
    const result = await PromoCodeService.getAllPromoCodes(
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 20
    );
    const stats = await PromoCodeService.getPromoCodeStats();
    res.json({ ...result, stats });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.post('/promo-codes', async (req: AuthRequest, res: Response) => {
  try {
    const promo = await PromoCodeService.createPromoCode(req.body);
    res.status(201).json({ promo });
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.patch('/promo-codes/:id', async (req: AuthRequest, res: Response) => {
  try {
    const promo = await PromoCodeService.updatePromoCode(parseInt(req.params.id), req.body);
    res.json({ promo });
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
});

router.delete('/promo-codes/:id', async (req: AuthRequest, res: Response) => {
  try {
    await PromoCodeService.deletePromoCode(parseInt(req.params.id));
    res.json({ message: 'Promo code deleted' });
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
});

// ─── Reports / Analytics ─────────────────────────────────────────────────────

router.get('/reports', async (_req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      usersThisMonth, usersLastMonth,
      bookingsThisMonth, bookingsLastMonth,
      revenueThisMonth, revenueLastMonth,
      propertiesThisMonth,
      bookingsByStatus,
      usersByRole,
      topDistricts,
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.booking.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.booking.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.transaction.findMany({ where: { type: 'DEPOSIT', status: 'CONFIRMED', createdAt: { gte: startOfMonth } }, select: { amount: true } }),
      prisma.transaction.findMany({ where: { type: 'DEPOSIT', status: 'CONFIRMED', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } }, select: { amount: true } }),
      prisma.property.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.booking.groupBy({ by: ['status'], _count: true }),
      prisma.user.groupBy({ by: ['role'], _count: true }),
      prisma.property.groupBy({ by: ['district'], _count: true, orderBy: { _count: { district: 'desc' } }, take: 5 }),
    ]);

    const revenueThisMonthVal = (revenueThisMonth as { amount: string }[]).reduce((s, t) => s + parseFloat(t.amount || '0'), 0);
    const revenueLastMonthVal = (revenueLastMonth as { amount: string }[]).reduce((s, t) => s + parseFloat(t.amount || '0'), 0);

    res.json({
      thisMonth: {
        users: usersThisMonth,
        bookings: bookingsThisMonth,
        revenue: revenueThisMonthVal.toFixed(4),
        properties: propertiesThisMonth,
      },
      lastMonth: {
        users: usersLastMonth,
        bookings: bookingsLastMonth,
        revenue: revenueLastMonthVal.toFixed(4),
      },
      bookingsByStatus: bookingsByStatus.map(b => ({ status: b.status, count: b._count })),
      usersByRole: usersByRole.map(u => ({ role: u.role, count: u._count })),
      topDistricts: topDistricts.map(d => ({ district: d.district, count: d._count })),
    });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
});

export default router;
