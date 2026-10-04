import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { WishlistService } from '../services/wishlist.service';

const router = Router();

// Add to favorites
router.post('/:propertyId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    const result = await WishlistService.addToFavorites(req.user!.id, propertyId);
    res.status(201).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add to favorites';
    res.status(400).json({ error: message });
  }
});

// Remove from favorites
router.delete('/:propertyId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    const result = await WishlistService.removeFromFavorites(req.user!.id, propertyId);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to remove from favorites';
    res.status(400).json({ error: message });
  }
});

// Get user's favorites
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await WishlistService.getUserFavorites(req.user!.id, page, limit);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get favorites';
    res.status(400).json({ error: message });
  }
});

// Check if property is favorite
router.get('/check/:propertyId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    const result = await WishlistService.checkIfFavorite(req.user!.id, propertyId);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to check favorite status';
    res.status(400).json({ error: message });
  }
});

// Get favorite count for property
router.get('/count/:propertyId', async (req, res: Response) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    const result = await WishlistService.getFavoriteCount(propertyId);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get count';
    res.status(400).json({ error: message });
  }
});

export default router;
