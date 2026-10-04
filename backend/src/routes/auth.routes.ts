import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, role, language } = req.body;
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!['TENANT', 'OWNER'].includes(role)) {
      return res.status(400).json({ error: 'Role must be TENANT or OWNER' });
    }
    const result = await AuthService.register({ name, email, phone, password, role, language });
    res.status(201).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({ error: message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const result = await AuthService.login(email, password);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ error: message });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }
    const result = await AuthService.refreshToken(refreshToken);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Token refresh failed';
    res.status(401).json({ error: message });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await AuthService.getProfile(req.user!.id);
    res.json({ user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get profile';
    res.status(400).json({ error: message });
  }
});

router.patch('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, language } = req.body;
    const user = await AuthService.updateProfile(req.user!.id, { name, phone, language });
    res.json({ user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Update failed';
    res.status(400).json({ error: message });
  }
});

router.patch('/wallet', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }
    const user = await AuthService.linkWallet(req.user!.id, walletAddress);
    res.json({ user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Wallet link failed';
    res.status(400).json({ error: message });
  }
});

router.post('/wallet/generate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await AuthService.generateWallet(req.user!.id);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Wallet generation failed';
    res.status(400).json({ error: message });
  }
});

export default router;
