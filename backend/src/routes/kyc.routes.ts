import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { KYCService } from '../services/kyc.service';

const router = Router();

// Submit KYC verification (authenticated users)
router.post('/submit', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { idDocFront, idDocBack, selfie } = req.body;

    if (!idDocFront || !idDocBack) {
      return res.status(400).json({ error: 'ID document front and back are required' });
    }

    const verification = await KYCService.submitVerification(req.user!.id, {
      idDocFront,
      idDocBack,
      selfie,
    });

    res.status(201).json({
      message: 'Verification submitted successfully',
      verification,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Submission failed';
    res.status(400).json({ error: message });
  }
});

// Get own verification status
router.get('/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const verification = await KYCService.getVerificationStatus(req.user!.id);
    res.json({ verification });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch status';
    res.status(400).json({ error: message });
  }
});

// Get all verifications (Admin only)
router.get('/all', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { status, page, limit } = req.query;
    const result = await KYCService.getAllVerifications({
      status: status as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
    });

    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch verifications';
    res.status(400).json({ error: message });
  }
});

// Review verification (Admin only)
router.post('/:id/review', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { decision, rejectionReason } = req.body;

    if (!decision || !['APPROVED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({ error: 'Valid decision (APPROVED/REJECTED) is required' });
    }

    const verification = await KYCService.reviewVerification(
      parseInt(id, 10),
      req.user!.id,
      decision,
      rejectionReason
    );

    res.json({
      message: `Verification ${decision.toLowerCase()} successfully`,
      verification,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Review failed';
    res.status(400).json({ error: message });
  }
});

// Delete verification (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await KYCService.deleteVerification(parseInt(id, 10));
    res.json({ message: 'Verification deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Deletion failed';
    res.status(400).json({ error: message });
  }
});

export default router;
