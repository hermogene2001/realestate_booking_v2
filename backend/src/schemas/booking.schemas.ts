import { z } from 'zod';

export const createBookingSchema = z.object({
  propertyId: z.number().int().positive(),
  startDate: z.string().min(1, 'startDate is required'),
  endDate: z.string().min(1, 'endDate is required'),
  promoCode: z.string().optional(),
});

export const txSchema = z.object({
  txHash: z.string().min(1, 'txHash is required'),
  escrowAmount: z
    .string()
    .refine((v) => v !== '0' && parseFloat(v) > 0, {
      message: 'escrowAmount must be a positive non-zero value',
    }),
  blockchainBookingId: z.number().int().positive().optional(),
});

export const modifyDatesSchema = z.object({
  startDate: z.string().min(1, 'startDate is required'),
  endDate: z.string().min(1, 'endDate is required'),
});

export const disputeSchema = z.object({
  reason: z.string().min(10, 'Dispute reason must be at least 10 characters'),
  againstUserId: z.number().int().positive().optional(),
});

export const remainingPaymentSchema = z.object({
  txHash: z.string().min(1, 'txHash is required'),
  amount: z.string().min(1, 'amount is required'),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type TxInput = z.infer<typeof txSchema>;
export type ModifyDatesInput = z.infer<typeof modifyDatesSchema>;
export type DisputeInput = z.infer<typeof disputeSchema>;
export type RemainingPaymentInput = z.infer<typeof remainingPaymentSchema>;
