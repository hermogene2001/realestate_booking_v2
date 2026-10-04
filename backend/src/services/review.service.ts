import { prisma } from '../config/database';

export class ReviewService {
  static async create(userId: number, data: {
    propertyId: number;
    bookingId: number;
    rating: number;
    comment: string;
  }) {
    // Verify user had a completed booking for this property
    const booking = await prisma.booking.findFirst({
      where: {
        id: data.bookingId,
        tenantId: userId,
        propertyId: data.propertyId,
        status: 'COMPLETED',
      },
    });

    if (!booking) {
      throw new Error('You can only review properties from completed bookings');
    }

    const existingReview = await prisma.review.findUnique({
      where: { bookingId: data.bookingId },
    });
    if (existingReview) {
      throw new Error('You have already reviewed this booking');
    }

    if (data.rating < 1 || data.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    return prisma.review.create({
      data: {
        userId,
        propertyId: data.propertyId,
        bookingId: data.bookingId,
        rating: data.rating,
        comment: data.comment,
      },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  static async getByProperty(propertyId: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { propertyId },
        include: { user: { select: { id: true, name: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({ where: { propertyId } }),
    ]);

    const avgRating = await prisma.review.aggregate({
      where: { propertyId },
      _avg: { rating: true },
    });

    return { reviews, total, avgRating: avgRating._avg.rating || 0, page, limit };
  }

  static async addReply(reviewId: number, ownerId: number, reply: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { property: true },
    });

    if (!review) throw new Error('Review not found');
    if (review.property.ownerId !== ownerId) throw new Error('Not authorized');

    return prisma.review.update({
      where: { id: reviewId },
      data: { ownerReply: reply },
    });
  }
}
