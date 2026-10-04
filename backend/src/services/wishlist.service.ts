import { prisma } from '../config/database';

export class WishlistService {
  static async addToFavorites(userId: number, propertyId: number) {
    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) throw new Error('Property not found');

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    });
    if (existing) throw new Error('Property already in favorites');

    const favorite = await prisma.favorite.create({
      data: {
        userId,
        propertyId,
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            priceEth: true,
            images: true,
            district: true,
          },
        },
      },
    });

    return favorite;
  }

  static async removeFromFavorites(userId: number, propertyId: number) {
    await prisma.favorite.delete({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    });

    return { message: 'Removed from favorites' };
  }

  static async getUserFavorites(userId: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              description: true,
              priceEth: true,
              images: true,
              district: true,

              bedrooms: true,
              bathrooms: true,
              isApproved: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  isVerified: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.favorite.count({ where: { userId } }),
    ]);

    return {
      favorites,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async checkIfFavorite(userId: number, propertyId: number) {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    });

    return { isFavorite: !!favorite };
  }

  static async getFavoriteCount(propertyId: number) {
    const count = await prisma.favorite.count({
      where: { propertyId },
    });

    return { count };
  }
}
