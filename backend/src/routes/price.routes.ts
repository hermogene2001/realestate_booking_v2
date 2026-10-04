import { Router, Response } from 'express';
import { PriceService } from '../services/price.service';

const router = Router();

router.get('/eth', async (_req, res: Response) => {
  try {
    const price = await PriceService.getEthPrice();
    res.json(price);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch price';
    res.status(500).json({ error: message });
  }
});

export default router;
