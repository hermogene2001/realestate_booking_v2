import express from 'express';
import { authenticate } from '../middleware/auth';
import { MessagingService } from '../services/messaging.service';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all conversations
router.get('/conversations', async (req: AuthRequest, res) => {
  try {
    const conversations = await MessagingService.getConversations(req.user!.id);
    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get conversation with specific user
router.get('/:userId', async (req: AuthRequest, res) => {
  try {
    const otherUserId = parseInt(req.params.userId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const conversation = await MessagingService.getConversation(
      req.user!.id,
      otherUserId,
      page,
      limit
    );

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Send message
router.post('/:userId', async (req: AuthRequest, res) => {
  try {
    const receiverId = parseInt(req.params.userId);
    const { content, propertyId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    if (receiverId === req.user!.id) {
      return res.status(400).json({ error: 'Cannot send message to yourself' });
    }

    const message = await MessagingService.sendMessage(
      req.user!.id,
      receiverId,
      content.trim(),
      propertyId
    );

    res.status(201).json(message);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread count
router.get('/unread', async (req: AuthRequest, res) => {
  try {
    const { count } = await MessagingService.getUnreadCount(req.user!.id);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark message as read
router.patch('/:messageId/read', async (req: AuthRequest, res) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const result = await MessagingService.markAsRead(messageId, req.user!.id);
    res.json(result);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Delete message
router.delete('/:messageId', async (req: AuthRequest, res) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const result = await MessagingService.deleteMessage(messageId, req.user!.id);
    res.json(result);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

export default router;
