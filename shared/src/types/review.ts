export interface Review {
  id: number;
  userId: number;
  propertyId: number;
  bookingId: number;
  rating: number;
  comment: string;
  ownerReply: string | null;
  createdAt: Date;
  updatedAt: Date;
}
