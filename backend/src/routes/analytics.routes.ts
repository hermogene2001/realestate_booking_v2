import { Router, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/overview', async (_req: AuthRequest, res: Response) => {
  const data = await AnalyticsService.getOverview();
  res.json(data);
});

router.get('/users', async (_req: AuthRequest, res: Response) => {
  const data = await AnalyticsService.getUserStats();
  res.json(data);
});

router.get('/properties', async (_req: AuthRequest, res: Response) => {
  const data = await AnalyticsService.getPropertyStats();
  res.json(data);
});

router.get('/bookings', async (_req: AuthRequest, res: Response) => {
  const data = await AnalyticsService.getBookingStats();
  res.json(data);
});

router.get('/fraud', async (_req: AuthRequest, res: Response) => {
  const data = await AnalyticsService.getFraudStats();
  res.json(data);
});

export default router;
