export enum NotificationType {
  BOOKING_CREATED = 'BOOKING_CREATED',
  DEPOSIT_CONFIRMED = 'DEPOSIT_CONFIRMED',
  HANDOVER_PENDING = 'HANDOVER_PENDING',
  FUNDS_RELEASED = 'FUNDS_RELEASED',
  REFUND_ISSUED = 'REFUND_ISSUED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  PROPERTY_APPROVED = 'PROPERTY_APPROVED',
  PROPERTY_REJECTED = 'PROPERTY_REJECTED',
  FRAUD_ALERT = 'FRAUD_ALERT',
}

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  message: string;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: Date;
}
