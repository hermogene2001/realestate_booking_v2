import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PaymentService } from '../services/payment.service';

const router = Router();

// Convert currency
router.post('/convert', async (req, res: Response) => {
  try {
    const { amount, from, to } = req.body;
    if (!amount || !from || !to) {
      return res.status(400).json({ error: 'Amount, from, and to currencies required' });
    }

    const converted = await PaymentService.convertCurrency(amount, from, to);
    res.json({ amount, from, to, convertedAmount: converted });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Conversion failed';
    res.status(400).json({ error: message });
  }
});

// Manual ETH payment (uses admin wallet to submit escrow)
router.post('/eth/manual', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId, walletAddress } = req.body;
    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID required' });
    }

    const result = await PaymentService.manualEthPayment(req.user!.id, bookingId, walletAddress);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Manual ETH payment failed';
    res.status(400).json({ error: message });
  }
});

// Pay remaining ETH via admin wallet (no MetaMask needed)
router.post('/eth/remaining', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID required' });
    }

    const result = await PaymentService.payRemainingEth(req.user!.id, bookingId);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to pay remaining';
    res.status(400).json({ error: message });
  }
});

// Initiate MoMo payment
router.post('/momo/initiate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId, amount, phoneNumber } = req.body;
    if (!bookingId || !amount || !phoneNumber) {
      return res.status(400).json({ error: 'Booking ID, amount, and phone number required' });
    }

    const result = await PaymentService.initiateMoMoPayment(req.user!.id, bookingId, amount, phoneNumber);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'MoMo initiation failed';
    res.status(400).json({ error: message });
  }
});

// Confirm MoMo payment
router.post('/momo/confirm', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId, transactionRef } = req.body;
    if (!paymentId || !transactionRef) {
      return res.status(400).json({ error: 'Payment ID and transaction reference required' });
    }

    const result = await PaymentService.confirmMoMoPayment(paymentId, transactionRef);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'MoMo confirmation failed';
    res.status(400).json({ error: message });
  }
});

// Initiate card payment
router.post('/card/initiate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId, amount, currency } = req.body;
    if (!bookingId || !amount) {
      return res.status(400).json({ error: 'Booking ID and amount required' });
    }

    const result = await PaymentService.initiateCardPayment(req.user!.id, bookingId, amount, currency || 'USD');
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Card payment initiation failed';
    res.status(400).json({ error: message });
  }
});

// Confirm card payment
router.post('/card/confirm', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID required' });
    }

    const result = await PaymentService.confirmCardPayment(paymentId);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Card confirmation failed';
    res.status(400).json({ error: message });
  }
});

// Get user payments
router.get('/my-payments', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await PaymentService.getUserPayments(req.user!.id, page, limit);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get payments';
    res.status(400).json({ error: message });
  }
});

// Get payment stats
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await PaymentService.getPaymentStats(req.user!.id);
    res.json(stats);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get stats';
    res.status(400).json({ error: message });
  }
});

// Refund payment (by booking ID)
router.post('/:id/refund', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const bookingId = parseInt(req.params.id);
    const result = await PaymentService.refundPayment(bookingId);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Refund failed';
    res.status(400).json({ error: message });
  }
});

export default router;
