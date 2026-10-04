import { Router, Response } from 'express';
import { BookingService } from '../services/booking.service';
import { AgreementService } from '../services/agreement.service';
import { TransactionService } from '../services/transaction.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { zodValidate } from '../middleware/zodValidate';
import { createBookingSchema, txSchema, modifyDatesSchema, disputeSchema, remainingPaymentSchema } from '../schemas/booking.schemas';

const router = Router();

// Tenant: create booking
router.post('/', authenticate, authorize('TENANT'), zodValidate(createBookingSchema), async (req: AuthRequest, res: Response) => {
  try {
    const result = await BookingService.create(req.user!.id, {
      propertyId: parseInt(req.body.propertyId),
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      promoCode: req.body.promoCode,
    });
    res.status(201).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create booking';
    res.status(400).json({ error: message });
  }
});

// User: get own bookings
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await BookingService.getByUser(req.user!.id, req.user!.role);
    res.json({ bookings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch bookings';
    res.status(500).json({ error: message });
  }
});

// User: get booking agreement and signature status
router.get('/:id/agreement', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await AgreementService.getAgreement(parseInt(req.params.id), req.user!);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch agreement';
    res.status(message.includes('Not authorized') ? 403 : 400).json({ error: message });
  }
});

// Tenant/Owner: digitally sign booking agreement
router.post('/:id/agreement/sign', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await AgreementService.signAgreement(
      parseInt(req.params.id),
      req.user!,
      req.ip || req.socket.remoteAddress,
    );
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to sign agreement';
    res.status(message.includes('Not authorized') ? 403 : 400).json({ error: message });
  }
});

// User: download booking agreement as PDF
router.get('/:id/agreement/download', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const pdf = await AgreementService.renderAgreementPdf(parseInt(req.params.id), req.user!);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="booking-agreement-${req.params.id}.pdf"`);
    res.setHeader('Content-Length', pdf.length);
    res.send(pdf);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to download agreement';
    res.status(message.includes('Not authorized') ? 403 : 400).json({ error: message });
  }
});

// User: get booking detail
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const booking = await BookingService.getById(parseInt(req.params.id), req.user!.id, req.user!.role);
    res.json({ booking });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Booking not found';
    if (message === 'Not authorized to view this booking') {
      return res.status(403).json({ error: message });
    }
    res.status(404).json({ error: message });
  }
});

// Tenant: record transaction hash after on-chain deposit
router.patch('/:id/tx', authenticate, zodValidate(txSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { txHash, escrowAmount, blockchainBookingId } = req.body;

    const booking = await BookingService.updateTxHash(
      parseInt(req.params.id),
      txHash,
      escrowAmount,
      req.user!.id,
      blockchainBookingId,
    );

    await TransactionService.record({
      bookingId: booking.id,
      txHash,
      type: 'DEPOSIT',
      amount: escrowAmount,
      fromAddress: req.user!.walletAddress || '',
      toAddress: 'contract',
    });

    res.json({ booking });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update tx';
    res.status(400).json({ error: message });
  }
});

// Tenant: pay remaining amount after deposit
router.patch('/:id/pay-remaining', authenticate, zodValidate(remainingPaymentSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { txHash, amount } = req.body;
    const booking = await BookingService.payRemaining(parseInt(req.params.id), req.user!.id, txHash);

    await TransactionService.record({
      bookingId: booking.id,
      txHash,
      type: 'REMAINING' as never,
      amount,
      fromAddress: req.user!.walletAddress || '',
      toAddress: 'contract',
    });

    res.json({ booking });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to pay remaining';
    res.status(400).json({ error: message });
  }
});

// Party: confirm handover
router.patch('/:id/confirm', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const booking = await BookingService.confirmHandover(parseInt(req.params.id), req.user!.id);
    res.json({ booking });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to confirm';
    res.status(400).json({ error: message });
  }
});

// Owner: accept booking request
router.patch('/:id/accept', authenticate, authorize('OWNER'), async (req: AuthRequest, res: Response) => {
  try {
    const booking = await BookingService.accept(parseInt(req.params.id), req.user!.id);
    res.json({ booking });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to accept booking';
    res.status(400).json({ error: message });
  }
});

// Owner: reject booking request
router.patch('/:id/reject', authenticate, authorize('OWNER'), async (req: AuthRequest, res: Response) => {
  try {
    const booking = await BookingService.reject(parseInt(req.params.id), req.user!.id);
    res.json({ booking });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reject booking';
    res.status(400).json({ error: message });
  }
});

// Party/Admin: cancel booking
router.patch('/:id/cancel', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const booking = await BookingService.cancel(parseInt(req.params.id), req.user!.id, req.user!.role);
    res.json({ booking });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to cancel';
    res.status(400).json({ error: message });
  }
});

// Party: raise dispute
router.patch('/:id/dispute', authenticate, zodValidate(disputeSchema), async (req: AuthRequest, res: Response) => {
  try {
    const booking = await BookingService.dispute(
      parseInt(req.params.id),
      req.user!.id,
      req.body.reason,
      req.body.againstUserId,
    );
    res.json({ booking });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to raise dispute';
    res.status(400).json({ error: message });
  }
});

// Tenant: modify booking dates (PENDING only)
router.patch('/:id/dates', authenticate, zodValidate(modifyDatesSchema), async (req: AuthRequest, res: Response) => {
  try {
    const booking = await BookingService.modifyDates(parseInt(req.params.id), req.user!.id, {
      startDate: req.body.startDate,
      endDate: req.body.endDate,
    });
    res.json({ booking });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to modify dates';
    res.status(400).json({ error: message });
  }
});

export default router;
