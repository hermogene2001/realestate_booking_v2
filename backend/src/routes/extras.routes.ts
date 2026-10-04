import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { InsuranceService, RewardTokenService, AgentService } from '../services/extras.service';

const router = Router();

// ── Insurance ──
router.post('/insurance', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const insurance = await InsuranceService.createInsurance(req.body);
    res.status(201).json(insurance);
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create insurance' });
  }
});

router.get('/insurance/booking/:bookingId', authenticate, async (req, res: Response) => {
  try {
    const insurance = await InsuranceService.getInsurance(parseInt(req.params.bookingId));
    if (!insurance) return res.status(404).json({ error: 'Insurance not found' });
    res.json(insurance);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch insurance' });
  }
});

router.put('/insurance/:bookingId/cancel', authenticate, async (req, res: Response) => {
  try {
    const insurance = await InsuranceService.cancelInsurance(parseInt(req.params.bookingId));
    res.json(insurance);
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to cancel insurance' });
  }
});

router.get('/insurance/active', authenticate, authorize('ADMIN'), async (_req: AuthRequest, res: Response) => {
  try {
    const insurances = await InsuranceService.getActiveInsurances();
    res.json(insurances);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch active insurances' });
  }
});

// ── Reward Tokens ──
router.get('/rewards/balance', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const balance = await RewardTokenService.getBalance(req.user!.id);
    res.json({ balance });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch balance' });
  }
});

router.get('/rewards/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const history = await RewardTokenService.getHistory(req.user!.id, page, limit);
    res.json(history);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch history' });
  }
});

router.post('/rewards/redeem', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { amount, description } = req.body;
    const result = await RewardTokenService.redeemTokens(req.user!.id, amount, description);
    res.json(result);
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to redeem tokens' });
  }
});

// ── Agent Portal ──
router.post('/agents/register', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const agent = await AgentService.createAgent(req.user!.id, req.body);
    res.status(201).json(agent);
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to register as agent' });
  }
});

router.get('/agents/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const agent = await AgentService.getAgent(req.user!.id);
    if (!agent) return res.status(404).json({ error: 'Agent profile not found' });
    res.json(agent);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch agent profile' });
  }
});

router.get('/agents', async (req, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const agents = await AgentService.getAllAgents(page, limit);
    res.json(agents);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch agents' });
  }
});

router.post('/agents/:id/verify', authenticate, authorize('ADMIN'), async (req, res: Response) => {
  try {
    const agent = await AgentService.verifyAgent(parseInt(req.params.id));
    res.json(agent);
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to verify agent' });
  }
});

export default router;
