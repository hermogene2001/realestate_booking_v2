export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  RELEASE = 'RELEASE',
  REFUND = 'REFUND',
  CANCEL = 'CANCEL',
  FEE = 'FEE',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
}

export interface Transaction {
  id: number;
  bookingId: number;
  txHash: string;
  type: TransactionType;
  amount: string;
  fromAddress: string;
  toAddress: string;
  status: TransactionStatus;
  createdAt: Date;
}
