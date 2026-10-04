import path from 'path';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { Prisma } from '@prisma/client';
import { PropertyDocumentService } from './propertyDocument.service';
import { NotificationService } from './notification.service';

interface PropertyFilters {
  district?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: number;
  bathrooms?: number;
  search?: string;
  status?: string;
  isApproved?: boolean;
  bounds?: string; // lat1,lng1,lat2,lng2
  page?: number;
  limit?: number;
}

export class PropertyService {
  static async list(filters: PropertyFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const skip = (page - 1) * limit;

    const where: Prisma.PropertyWhereInput = {
      isApproved: filters.isApproved !== undefined ? filters.isApproved : true,
    };
    const statusFilter = filters.status;
    if (statusFilter && statusFilter !== 'ALL') {
      where.status = statusFilter as never;
    } else if (!statusFilter) {
      where.status = 'AVAILABLE' as never;
    }

    if (filters.district) {
      where.district = filters.district;
    }
    if (filters.bedrooms) {
      where.bedrooms = { gte: filters.bedrooms };
    }
    if (filters.bathrooms) {
      where.bathrooms = { gte: filters.bathrooms };
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
        { location: { contains: filters.search } },
      ];
    }
    if (filters.bounds) {
      const [lat1, lng1, lat2, lng2] = filters.bounds.split(',').map(Number);
      where.lat = { gte: Math.min(lat1, lat2), lte: Math.max(lat1, lat2) };
      where.lng = { gte: Math.min(lng1, lng2), lte: Math.max(lng1, lng2) };
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: { owner: { select: { id: true, name: true, phone: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.property.count({ where }),
    ]);

    return { properties, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getById(id: number) {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, phone: true, email: true } },
        reviews: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!property) throw new Error('Property not found');
    return property;
  }

  static async create(ownerId: number, data: {
    title: string;
    description: string;
    location: string;
    district: string;
    lat: number;
    lng: number;
    priceEth: string;
    depositEth: string;
    images: string[];
    bedrooms: number;
    bathrooms: number;
    area: number;
    amenities: string[];
  }) {
    return prisma.property.create({
      data: {
        ...data,
        ownerId,
        images: JSON.stringify(data.images),
        amenities: JSON.stringify(data.amenities),
      },
    });
  }

  static async update(id: number, ownerId: number, data: Partial<{
    title: string;
    description: string;
    location: string;
    district: string;
    lat: number;
    lng: number;
    priceEth: string;
    depositEth: string;
    images: string[];
    bedrooms: number;
    bathrooms: number;
    area: number;
    amenities: string[];
    status: string;
  }>) {
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) throw new Error('Property not found');
    if (property.ownerId !== ownerId) throw new Error('Not authorized');

    const updateData: Record<string, unknown> = { ...data };
    if (data.images) updateData.images = JSON.stringify(data.images);
    if (data.amenities) updateData.amenities = JSON.stringify(data.amenities);

    return prisma.property.update({ where: { id }, data: updateData });
  }

  static async remove(id: number, userId: number, userRole: string) {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        bookings: {
          select: { id: true, status: true, startDate: true, endDate: true },
        },
      },
    });
    if (!property) throw new Error('Property not found');
    if (property.ownerId !== userId && userRole !== 'ADMIN') {
      throw new Error('Not authorized');
    }

    const now = new Date();
    const activeBookings = property.bookings.filter(b =>
      ['PENDING', 'LOCKED'].includes(b.status) && b.endDate > now
    );
    if (activeBookings.length > 0) {
      const details = activeBookings.map(b =>
        `${b.status} (${b.startDate.toLocaleDateString()} – ${b.endDate.toLocaleDateString()})`
      ).join(', ');
      throw new Error(`Cannot delete property: active bookings exist — ${details}`);
    }

    // Remove past bookings so the FK constraint doesn't block deletion
    if (property.bookings.length > 0) {
      await prisma.booking.deleteMany({
        where: { propertyId: id },
      });
    }

    return prisma.property.delete({ where: { id } });
  }

  static async approve(id: number, isApproved: boolean) {
    return prisma.property.update({
      where: { id },
      data: { isApproved },
    });
  }

  static async canApproveProperty(propertyId: number): Promise<{ canApprove: boolean; reason?: string }> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return { canApprove: false, reason: 'Property not found' };
    }

    // Check all documents uploaded
    const allUploaded = await PropertyDocumentService.checkAllDocumentsUploaded(propertyId);
    if (!allUploaded) {
      const missing = await PropertyDocumentService.getMissingDocumentTypes(propertyId);
      return {
        canApprove: false,
        reason: `Cannot approve property: missing documents - ${missing.join(', ')}`,
      };
    }

    // Check no documents rejected
    const rejectedDocs = await prisma.propertyDocument.findMany({
      where: {
        propertyId,
        status: 'REJECTED',
      },
    });

    if (rejectedDocs.length > 0) {
      return {
        canApprove: false,
        reason: 'Cannot approve property: some documents have been rejected',
      };
    }

    return { canApprove: true };
  }

  static async getPropertyApprovalStatus(propertyId: number) {
    return PropertyDocumentService.getPropertyApprovalStatus(propertyId);
  }

  static async approvePropertyWithDocumentCheck(
    propertyId: number,
    locationData?: { location?: string; district?: string; lat?: number; lng?: number }
  ): Promise<any> {
    const canApprove = await this.canApproveProperty(propertyId);
    if (!canApprove.canApprove) {
      throw new Error(canApprove.reason);
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    const updated = await prisma.property.update({
      where: { id: propertyId },
      data: {
        isApproved: true,
        ...(locationData?.location !== undefined && { location: locationData.location }),
        ...(locationData?.district !== undefined && { district: locationData.district }),
        ...(locationData?.lat !== undefined && { lat: locationData.lat }),
        ...(locationData?.lng !== undefined && { lng: locationData.lng }),
      },
    });

    await NotificationService.create(
      property.ownerId,
      'PROPERTY_APPROVED',
      'Your property has been approved and is now visible to tenants',
      { propertyId }
    );

    return updated;
  }

  static async getAllWithStatus(filters: { status?: string; isApproved?: string; search?: string; page?: number; limit?: number }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PropertyWhereInput = {};

    if (filters.status) where.status = filters.status as any;
    if (filters.isApproved !== undefined && filters.isApproved !== '') {
      where.isApproved = filters.isApproved === 'true';
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { location: { contains: filters.search } },
        { district: { contains: filters.search } },
      ];
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { bookings: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    return { properties, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getByOwner(ownerId: number) {
    return prisma.property.findMany({
      where: { ownerId },
      include: { bookings: { select: { id: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getPendingPropertiesWithDocuments() {
    const properties = await prisma.property.findMany({
      where: {
        isApproved: false,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        propertyDocuments: {
          select: {
            id: true,
            documentType: true,
            fileName: true,
            filePath: true,
            mimeType: true,
            status: true,
            rejectionReason: true,
            uploadedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const uploadDir = path.resolve(env.UPLOAD_DIR);
    return properties.map(p => ({
      ...p,
      propertyDocuments: p.propertyDocuments.map(d => ({
        ...d,
        fileUrl: `/uploads/${path.relative(uploadDir, d.filePath).replace(/\\/g, '/')}`,
      })),
    }));
  }
}
