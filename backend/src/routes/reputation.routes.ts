import { Router, Response } from 'express';
import { ReputationService } from '../services/reputation.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();

router.get('/user/:userId', async (req, res: Response) => {
  try {
    const rep = await ReputationService.getReputation(parseInt(req.params.userId));
    res.json({ reputation: rep });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch reputation';
    res.status(500).json({ error: message });
  }
});

router.post('/attest', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const rep = await ReputationService.submitAttestation(
      parseInt(req.body.subjectId),
      parseInt(req.body.score),
      req.body.comment || '',
    );
    res.status(201).json({ reputation: rep });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to submit attestation';
    res.status(400).json({ error: message });
  }
});

router.post('/booking/:bookingId/trigger', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await ReputationService.triggerBookingReputation(parseInt(req.params.bookingId));
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to trigger reputation';
    res.status(400).json({ error: message });
  }
});

export default router;
