export enum BookingStatus {
  PENDING = 'PENDING',
  LOCKED = 'LOCKED',
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED',
}

export enum EscrowState {
  Created = 0,
  Locked = 1,
  Completed = 2,
  Refunded = 3,
  Disputed = 4,
  Cancelled = 5,
}

export interface Booking {
  id: number;
  tenantId: number;
  propertyId: number;
  status: BookingStatus;
  txHash: string | null;
  escrowAmount: string | null;
  startDate: Date;
  endDate: Date;
  tenantConfirmed: boolean;
  ownerConfirmed: boolean;
  timeoutAt: Date | null;
  totalAmount: string | null;
  remainingAmount: string | null;
  remainingPaid: boolean;
  remainingTxHash: string | null;
  fullPaidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
