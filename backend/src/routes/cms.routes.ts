import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { CMSService } from '../services/cms.service';

const router = Router();

router.get('/posts', async (req, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const result = await CMSService.getAllPosts(status, page, limit);
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch posts' });
  }
});

router.get('/posts/:slug', async (req, res: Response) => {
  try {
    const post = await CMSService.getPost(req.params.slug);
    res.json(post);
  } catch (error: unknown) {
    const status = error instanceof Error && error.message === 'Post not found' ? 404 : 500;
    res.status(status).json({ error: error instanceof Error ? error.message : 'Failed to fetch post' });
  }
});

router.post('/posts', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const post = await CMSService.createPost({ ...req.body, authorId: req.user!.id });
    res.status(201).json(post);
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create post' });
  }
});

router.put('/posts/:id', authenticate, authorize('ADMIN'), async (req, res: Response) => {
  try {
    const post = await CMSService.updatePost(parseInt(req.params.id), req.body);
    res.json(post);
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update post' });
  }
});

router.post('/posts/:id/publish', authenticate, authorize('ADMIN'), async (req, res: Response) => {
  try {
    const post = await CMSService.publishPost(parseInt(req.params.id));
    res.json(post);
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to publish post' });
  }
});

router.delete('/posts/:id', authenticate, authorize('ADMIN'), async (req, res: Response) => {
  try {
    const result = await CMSService.deletePost(parseInt(req.params.id));
    res.json(result);
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to delete post' });
  }
});

export default router;
