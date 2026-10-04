import { Router, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await NotificationService.getByUser(
      req.user!.id,
      req.query.unread === 'true',
      req.query.page ? parseInt(req.query.page as string) : 1,
      req.query.limit ? parseInt(req.query.limit as string) : 20
    );
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch notifications';
    res.status(500).json({ error: message });
  }
});

router.patch('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await NotificationService.markRead(parseInt(req.params.id), req.user!.id);
    res.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to mark as read';
    res.status(400).json({ error: message });
  }
});

router.patch('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const count = await NotificationService.markAllRead(req.user!.id);
    res.json({ count });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to mark all as read';
    res.status(400).json({ error: message });
  }
});

export default router;
