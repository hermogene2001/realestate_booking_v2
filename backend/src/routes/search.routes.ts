import { Router, Response } from 'express';
import { SearchService } from '../services/search.service';

const router = Router();

// Advanced property search
router.get('/properties', async (req, res: Response) => {
  try {
    const params = {
      query: req.query.q as string,
      district: req.query.district as string,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      propertyType: req.query.propertyType as string,
      minBedrooms: req.query.minBedrooms ? parseInt(req.query.minBedrooms as string) : undefined,
      maxBedrooms: req.query.maxBedrooms ? parseInt(req.query.maxBedrooms as string) : undefined,
      amenities: req.query.amenities ? (req.query.amenities as string).split(',') : undefined,
      lat: req.query.lat ? parseFloat(req.query.lat as string) : undefined,
      lng: req.query.lng ? parseFloat(req.query.lng as string) : undefined,
      radius: req.query.radius ? parseFloat(req.query.radius as string) : undefined,
      sortBy: req.query.sortBy as string,
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    const result = await SearchService.searchProperties(params);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Search failed';
    res.status(400).json({ error: message });
  }
});

// Get search suggestions
router.get('/suggestions', async (req, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    const suggestions = await SearchService.getSearchSuggestions(query);
    res.json(suggestions);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get suggestions';
    res.status(400).json({ error: message });
  }
});

// Get popular searches
router.get('/popular', async (req, res: Response) => {
  try {
    const popular = await SearchService.getPopularSearches();
    res.json(popular);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get popular searches';
    res.status(400).json({ error: message });
  }
});

export default router;
