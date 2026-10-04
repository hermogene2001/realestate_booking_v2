import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { TwoFactorService } from '../services/twoFactor.service';
import { prisma } from '../config/database';

const router = Router();

// Setup 2FA - Generate QR code and backup codes
router.post('/setup', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await TwoFactorService.setup2FA(req.user!.id);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '2FA setup failed';
    res.status(400).json({ error: message });
  }
});

// Verify 2FA setup and enable
router.post('/verify-setup', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Verification token required' });
    }

    const result = await TwoFactorService.verify2FASetup(req.user!.id, token);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Verification failed';
    res.status(400).json({ error: message });
  }
});

// Verify 2FA token (used during login)
router.post('/verify', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Verification token required' });
    }

    const valid = await TwoFactorService.verify2FAToken(req.user!.id, token);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    res.json({ valid: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Verification failed';
    res.status(400).json({ error: message });
  }
});

// Disable 2FA
router.post('/disable', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Verification token required' });
    }

    const result = await TwoFactorService.disable2FA(req.user!.id, token);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to disable 2FA';
    res.status(400).json({ error: message });
  }
});

// Regenerate backup codes
router.post('/regenerate-codes', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await TwoFactorService.regenerateBackupCodes(req.user!.id);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to regenerate codes';
    res.status(400).json({ error: message });
  }
});

// Get 2FA status
router.get('/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        twoFactorEnabled: true,
      },
    });

    res.json({ enabled: user?.twoFactorEnabled || false });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get status';
    res.status(400).json({ error: message });
  }
});

export default router;
