import { Router, Response } from 'express';
import { PropertyService } from '../services/property.service';
import { ReviewService } from '../services/review.service';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { upload } from '../middleware/upload';

const router = Router();

// Public: list properties
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await PropertyService.list({
      district: req.query.district as string,
      minPrice: req.query.minPrice as string,
      maxPrice: req.query.maxPrice as string,
      bedrooms: req.query.bedrooms ? parseInt(req.query.bedrooms as string) : undefined,
      bathrooms: req.query.bathrooms ? parseInt(req.query.bathrooms as string) : undefined,
      search: req.query.search as string,
      status: req.query.status as string,
      bounds: req.query.bounds as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 12,
    });
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch properties';
    res.status(500).json({ error: message });
  }
});

// Public: get property by ID
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const property = await PropertyService.getById(parseInt(req.params.id));
    res.json({ property });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Property not found';
    res.status(404).json({ error: message });
  }
});

// Public: get reviews for a property
router.get('/:id/reviews', async (req: AuthRequest, res: Response) => {
  try {
    const result = await ReviewService.getByProperty(
      parseInt(req.params.id),
      req.query.page ? parseInt(req.query.page as string) : 1,
      req.query.limit ? parseInt(req.query.limit as string) : 10
    );
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch reviews';
    res.status(500).json({ error: message });
  }
});

// Owner: create property
router.post('/',
  authenticate,
  authorize('OWNER'),
  upload.array('images', 5),
  async (req: AuthRequest, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      const images = files ? files.map(f => `/uploads/${f.filename}`) : [];

      const property = await PropertyService.create(req.user!.id, {
        title: req.body.title,
        description: req.body.description,
        location: req.body.location,
        district: req.body.district,
        lat: parseFloat(req.body.lat),
        lng: parseFloat(req.body.lng),
        priceEth: req.body.priceEth,
        depositEth: req.body.depositEth,
        images,
        bedrooms: parseInt(req.body.bedrooms) || 1,
        bathrooms: parseInt(req.body.bathrooms) || 1,
        area: parseFloat(req.body.area) || 0,
        amenities: req.body.amenities ? JSON.parse(req.body.amenities) : [],
      });

      res.status(201).json({ property });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create property';
      res.status(400).json({ error: message });
    }
  }
);

// Owner: update property
router.put('/:id', authenticate, authorize('OWNER'), async (req: AuthRequest, res: Response) => {
  try {
    const property = await PropertyService.update(
      parseInt(req.params.id),
      req.user!.id,
      req.body
    );
    res.json({ property });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update property';
    res.status(400).json({ error: message });
  }
});

// Owner/Admin: delete property
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await PropertyService.remove(parseInt(req.params.id), req.user!.id, req.user!.role);
    res.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete property';
    res.status(400).json({ error: message });
  }
});

// Admin: approve/reject property
router.patch('/:id/approve',
  authenticate,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const property = await PropertyService.approve(
        parseInt(req.params.id),
        req.body.isApproved
      );
      res.json({ property });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to approve property';
      res.status(400).json({ error: message });
    }
  }
);

// Owner: get own properties
router.get('/owner/mine', authenticate, authorize('OWNER'), async (req: AuthRequest, res: Response) => {
  try {
    const properties = await PropertyService.getByOwner(req.user!.id);
    res.json({ properties });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch properties';
    res.status(500).json({ error: message });
  }
});

export default router;
