import { Router, Response } from 'express';
import { ReviewService } from '../services/review.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();

// Tenant: create review
router.post('/', authenticate, authorize('TENANT'), async (req: AuthRequest, res: Response) => {
  try {
    const review = await ReviewService.create(req.user!.id, {
      propertyId: parseInt(req.body.propertyId),
      bookingId: parseInt(req.body.bookingId),
      rating: parseInt(req.body.rating),
      comment: req.body.comment,
    });
    res.status(201).json({ review });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create review';
    res.status(400).json({ error: message });
  }
});

// Owner: reply to review
router.patch('/:id/reply', authenticate, authorize('OWNER'), async (req: AuthRequest, res: Response) => {
  try {
    const review = await ReviewService.addReply(
      parseInt(req.params.id),
      req.user!.id,
      req.body.ownerReply
    );
    res.json({ review });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add reply';
    res.status(400).json({ error: message });
  }
});

export default router;
