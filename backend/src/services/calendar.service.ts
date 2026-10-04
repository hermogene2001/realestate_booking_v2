import { prisma } from '../config/database';

export class CalendarService {
  static async getPropertyAvailability(propertyId: number, startDate: Date, endDate: Date) {
    const availabilities = await prisma.availability.findMany({
      where: {
        propertyId,
        OR: [
          {
            date: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
      orderBy: { date: 'asc' },
    });

    return availabilities;
  }

  static async addAvailability(propertyId: number, ownerId: number, date: Date, endDate: Date) {
    // Verify property ownership
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.ownerId !== ownerId) {
      throw new Error('Property not found or unauthorized');
    }

    const availability = await prisma.availability.create({
      data: {
        propertyId,
        date,
        endDate,
      },
    });

    return availability;
  }

  static async blockDates(propertyId: number, ownerId: number, date: Date, endDate: Date, bookingId?: number) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.ownerId !== ownerId) {
      throw new Error('Property not found or unauthorized');
    }

    const availability = await prisma.availability.create({
      data: {
        propertyId,
        date,
        endDate,
        isBooked: true,
        bookingId,
      },
    });

    return availability;
  }

  static async getAvailableDates(propertyId: number, months = 3) {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setMonth(futureDate.getMonth() + months);

    const availabilities = await prisma.availability.findMany({
      where: {
        propertyId,
        isBooked: false,
        date: {
          gte: today,
          lte: futureDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    return availabilities;
  }

  static async getBookedDates(propertyId: number, startDate: Date, endDate: Date) {
    const booked = await prisma.availability.findMany({
      where: {
        propertyId,
        isBooked: true,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        booking: {
          select: {
            id: true,
            tenantId: true,
            status: true,
          },
        },
      },
    });

    return booked;
  }

  static async updateAvailability(availabilityId: number, ownerId: number, data: {
    date?: Date;
    endDate?: Date;
    isBooked?: boolean;
  }) {
    const availability = await prisma.availability.findUnique({
      where: { id: availabilityId },
      include: { property: true },
    });

    if (!availability || availability.property.ownerId !== ownerId) {
      throw new Error('Not found or unauthorized');
    }

    const updated = await prisma.availability.update({
      where: { id: availabilityId },
      data,
    });

    return updated;
  }

  static async deleteAvailability(availabilityId: number, ownerId: number) {
    const availability = await prisma.availability.findUnique({
      where: { id: availabilityId },
      include: { property: true },
    });

    if (!availability || availability.property.ownerId !== ownerId) {
      throw new Error('Not found or unauthorized');
    }

    if (availability.isBooked) {
      throw new Error('Cannot delete booked availability');
    }

    await prisma.availability.delete({
      where: { id: availabilityId },
    });

    return { message: 'Availability deleted' };
  }

  static async getCalendarStats(propertyId: number) {
    const [total, available, booked] = await Promise.all([
      prisma.availability.count({ where: { propertyId } }),
      prisma.availability.count({ where: { propertyId, isBooked: false } }),
      prisma.availability.count({ where: { propertyId, isBooked: true } }),
    ]);

    return { total, available, booked };
  }
}
