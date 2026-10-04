import { prisma } from '../config/database';

export class LongTermRentalService {
  static async createLease(data: {
    propertyId: number;
    tenantId: number;
    monthlyRent: number;
    deposit?: number;
    leaseStart: Date;
    leaseEnd: Date;
    paymentDay?: number;
    autoRenew?: boolean;
    terms?: string;
  }) {
    const lease = await prisma.longTermRental.create({
      data: {
        ...data,
        deposit: data.deposit || 0,
        paymentDay: data.paymentDay || 1,
        autoRenew: data.autoRenew || false,
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            location: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return lease;
  }

  static async getActiveLeases(propertyId?: number) {
    const where: any = { status: 'ACTIVE' };
    if (propertyId) where.propertyId = propertyId;

    const leases = await prisma.longTermRental.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            location: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { leaseEnd: 'asc' },
    });

    return leases;
  }

  static async getTenantLeases(tenantId: number) {
    const leases = await prisma.longTermRental.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            location: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return leases;
  }

  static async terminateLease(leaseId: number) {
    const lease = await prisma.longTermRental.update({
      where: { id: leaseId },
      data: {
        status: 'TERMINATED',
        leaseEnd: new Date(),
      },
    });

    return lease;
  }

  static async renewLease(leaseId: number, newEndDate: Date) {
    const lease = await prisma.longTermRental.update({
      where: { id: leaseId },
      data: {
        leaseEnd: newEndDate,
        status: 'ACTIVE',
      },
    });

    return lease;
  }

  static async getExpiringLeases(daysAhead = 30) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + daysAhead);

    const leases = await prisma.longTermRental.findMany({
      where: {
        status: 'ACTIVE',
        leaseEnd: {
          lte: expirationDate,
          gte: new Date(),
        },
      },
      include: {
        property: true,
        tenant: true,
      },
    });

    return leases;
  }

  static async calculateMonthlyRevenue() {
    const activeLeases = await prisma.longTermRental.findMany({
      where: { status: 'ACTIVE' },
      select: { monthlyRent: true },
    });

    const totalMonthlyRevenue = activeLeases.reduce(
      (sum: number, lease: { monthlyRent: number }) => sum + lease.monthlyRent,
      0
    );

    return {
      totalMonthlyRevenue,
      activeLeases: activeLeases.length,
    };
  }
}

export class PropertyManagementService {
  static async createMaintenanceRequest(data: {
    propertyId: number;
    tenantId?: number;
    title: string;
    description: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    photos?: string[];
  }) {
    const request = await prisma.maintenanceRequest.create({
      data: {
        ...data,
        priority: data.priority || 'MEDIUM',
        photos: data.photos || [],
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            location: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return request;
  }

  static async assignRequest(requestId: number, assigneeId: number) {
    const request = await prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        assignedTo: assigneeId,
        status: 'IN_PROGRESS',
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return request;
  }

  static async completeRequest(requestId: number, cost: number = 0) {
    const request = await prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        status: 'COMPLETED',
        cost,
        completedAt: new Date(),
      },
    });

    return request;
  }

  static async getPropertyRequests(propertyId: number, status?: string) {
    const where: any = { propertyId };
    if (status) where.status = status;

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests;
  }

  static async getUrgentRequests() {
    const requests = await prisma.maintenanceRequest.findMany({
      where: {
        OR: [
          { priority: 'URGENT' },
          { priority: 'HIGH' },
        ],
        status: {
          in: ['OPEN', 'IN_PROGRESS'],
        },
      },
      include: {
        property: true,
        tenant: true,
        assignee: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests;
  }

  static async getMaintenanceStats(propertyId?: number) {
    const where: any = {};
    if (propertyId) where.propertyId = propertyId;

    const [total, open, inProgress, completed, urgent] = await Promise.all([
      prisma.maintenanceRequest.count({ where }),
      prisma.maintenanceRequest.count({ where: { ...where, status: 'OPEN' } }),
      prisma.maintenanceRequest.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.maintenanceRequest.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.maintenanceRequest.count({
        where: {
          ...where,
          OR: [{ priority: 'URGENT' }, { priority: 'HIGH' }],
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
      }),
    ]);

    const totalCost = await prisma.maintenanceRequest.aggregate({
      where: { ...where, status: 'COMPLETED' },
      _sum: { cost: true },
    });

    return {
      total,
      open,
      inProgress,
      completed,
      urgent,
      totalCost: totalCost._sum.cost || 0,
    };
  }

  static async cancelRequest(requestId: number) {
    const request = await prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        status: 'CANCELLED',
      },
    });

    return request;
  }
}
