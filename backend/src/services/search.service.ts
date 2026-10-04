import { prisma } from '../config/database';

export class SearchService {
  static async searchProperties(params: {
    query?: string;
    district?: string;
    minPrice?: number;
    maxPrice?: number;
    propertyType?: string;
    minBedrooms?: number;
    maxBedrooms?: number;
    amenities?: string[];
    lat?: number;
    lng?: number;
    radius?: number; // in km
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const {
      query,
      district,
      minPrice,
      maxPrice,
      propertyType,
      minBedrooms,
      maxBedrooms,
      amenities,
      lat,
      lng,
      radius,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = params;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isApproved: true,
      status: 'AVAILABLE',
    };

    if (query) {
      where.OR = [
        { title: { contains: query } },
        { description: { contains: query } },
      ];
    }

    if (district) {
      where.district = district;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.priceEth = {};
      if (minPrice !== undefined) where.priceEth.gte = minPrice;
      if (maxPrice !== undefined) where.priceEth.lte = maxPrice;
    }

    if (propertyType) {
      where.propertyType = propertyType;
    }

    if (minBedrooms !== undefined) {
      where.bedrooms = { gte: minBedrooms };
    }

    if (maxBedrooms !== undefined) {
      where.bedrooms = { ...where.bedrooms, lte: maxBedrooms };
    }

    if (amenities && amenities.length > 0) {
      where.amenities = {
        array_contains: amenities,
      };
    }

    // Location-based search (if lat/lng provided)
    if (lat && lng && radius) {
      // MySQL spatial query - approximate with simple distance calculation
      // For production, use proper GIS functions
      const latDiff = radius / 111; // ~111 km per degree latitude
      const lngDiff = radius / (111 * Math.cos(lat * Math.PI / 180));

      where.lat = {
        gte: lat - latDiff,
        lte: lat + latDiff,
      };
      where.lng = {
        gte: lng - lngDiff,
        lte: lng + lngDiff,
      };
    }

    // Build order by
    const orderBy: any = {};
    if (sortBy === 'priceEth') {
      orderBy.priceEth = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === 'bedrooms') {
      orderBy.bedrooms = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Execute query
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              isVerified: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    return {
      properties,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getSearchSuggestions(query: string, limit = 10) {
    const [titles, districts] = await Promise.all([
      prisma.property.findMany({
        where: {
          title: { contains: query },
          isApproved: true,
        },
        select: { title: true },
        distinct: ['title'],
        take: limit,
      }),
      prisma.property.findMany({
        where: {
          district: { contains: query },
          isApproved: true,
        },
        select: { district: true },
        distinct: ['district'],
        take: limit,
      }),
    ]);

    return {
      titles: titles.map((t: { title: string }) => t.title),
      districts: districts.map((d: { district: string }) => d.district),
    };
  }

  static async getPopularSearches(limit = 10) {
    const popularDistricts = await prisma.property.groupBy({
      by: ['district'],
      _count: { id: true },
      where: { isApproved: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    return popularDistricts.map((d: { district: string; _count: { id: number } }) => ({
      district: d.district,
      count: d._count.id,
    }));
  }
}
