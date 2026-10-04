import { Router, Response } from 'express';
import { TokenService } from '../services/token.service';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/mint', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await TokenService.mintShares(
      req.user!.id,
      parseInt(req.body.propertyId),
      parseInt(req.body.shareCount),
      req.body.pricePerShare,
    );
    res.status(201).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to mint shares';
    res.status(400).json({ error: message });
  }
});

router.post('/buy', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const purchase = await TokenService.buyShares(
      req.user!.id,
      parseInt(req.body.propertyShareId),
      parseInt(req.body.amount),
    );
    res.status(201).json({ purchase });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to buy shares';
    res.status(400).json({ error: message });
  }
});

router.get('/property/:propertyId', async (req, res: Response) => {
  try {
    const shares = await TokenService.getSharesByProperty(parseInt(req.params.propertyId));
    res.json({ shares });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch shares';
    res.status(500).json({ error: message });
  }
});

router.get('/mine', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const shares = await TokenService.getUserShares(req.user!.id);
    const owned = await TokenService.getOwnerShares(req.user!.id);
    res.json({ shares, owned });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch shares';
    res.status(500).json({ error: message });
  }
});

router.patch('/:id/price', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const share = await TokenService.updatePrice(req.user!.id, parseInt(req.params.id), req.body.pricePerShare);
    res.json({ share });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update price';
    res.status(400).json({ error: message });
  }
});

export default router;
