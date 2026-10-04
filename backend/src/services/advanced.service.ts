import { prisma } from '../config/database';

export class VirtualTourService {
  static async createTour(data: {
    propertyId: number;
    tourUrl: string;
    type: '360_PHOTO' | 'VIDEO';
    title: string;
    description?: string;
    thumbnail?: string;
  }) {
    const tour = await prisma.virtualTour.create({
      data,
      include: {
        property: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return tour;
  }

  static async getPropertyTours(propertyId: number) {
    const tours = await prisma.virtualTour.findMany({
      where: {
        propertyId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return tours;
  }

  static async toggleTour(tourId: number) {
    const tour = await prisma.virtualTour.findUnique({
      where: { id: tourId },
    });

    if (!tour) {
      throw new Error('Tour not found');
    }

    const updated = await prisma.virtualTour.update({
      where: { id: tourId },
      data: {
        isActive: !tour.isActive,
      },
    });

    return updated;
  }

  static async deleteTour(tourId: number) {
    await prisma.virtualTour.delete({
      where: { id: tourId },
    });

    return { message: 'Tour deleted' };
  }
}

export class SmartHomeService {
  static async addDevice(data: {
    propertyId: number;
    deviceType: string;
    deviceId: string;
    name: string;
    metadata?: any;
  }) {
    const device = await prisma.smartDevice.create({
      data,
      include: {
        property: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return device;
  }

  static async getPropertyDevices(propertyId: number) {
    const devices = await prisma.smartDevice.findMany({
      where: { propertyId },
      orderBy: { deviceType: 'asc' },
    });

    return devices;
  }

  static async updateDeviceStatus(deviceId: number, isOnline: boolean) {
    const device = await prisma.smartDevice.update({
      where: { id: deviceId },
      data: { isOnline },
    });

    return device;
  }

  static async removeDevice(deviceId: number) {
    await prisma.smartDevice.delete({
      where: { id: deviceId },
    });

    return { message: 'Device removed' };
  }

  static async controlDevice(deviceId: number, command: string, params: any = {}) {
    // Integration with smart home APIs (IoT platforms)
    // This is a placeholder for actual IoT integration
    const device = await prisma.smartDevice.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      throw new Error('Device not found');
    }

    // Simulate device control
    console.log(`[SmartHome] Controlling ${device.name}: ${command}`, params);

    return {
      success: true,
      message: `Command ${command} sent to ${device.name}`,
    };
  }
}

export class CorporateAccountService {
  static async createAccount(data: {
    companyName: string;
    contactEmail: string;
    contactPhone: string;
    address?: string;
    discountPercent?: number;
    monthlyLimit?: number;
  }) {
    const account = await prisma.corporateAccount.create({
      data,
    });

    return account;
  }

  static async getAccount(email: string) {
    const account = await prisma.corporateAccount.findUnique({
      where: { contactEmail: email },
    });

    return account;
  }

  static async applyDiscount(accountId: number, amount: number) {
    const account = await prisma.corporateAccount.findUnique({
      where: { id: accountId },
    });

    if (!account || !account.isActive) {
      throw new Error('Account not found or inactive');
    }

    const discount = amount * (account.discountPercent / 100);
    const finalAmount = amount - discount;

    return {
      originalAmount: amount,
      discount,
      finalAmount,
      discountPercent: account.discountPercent,
    };
  }

  static async getAllAccounts(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [accounts, total] = await Promise.all([
      prisma.corporateAccount.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.corporateAccount.count(),
    ]);

    return {
      accounts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export class CommunityService {
  static async createEvent(data: {
    title: string;
    description: string;
    location?: string;
    eventDate: Date;
    organizerId: number;
    maxAttendees?: number;
  }) {
    const event = await prisma.communityEvent.create({
      data,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return event;
  }

  static async getUpcomingEvents(limit = 20) {
    const events = await prisma.communityEvent.findMany({
      where: {
        isActive: true,
        eventDate: {
          gte: new Date(),
        },
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { eventDate: 'asc' },
      take: limit,
    });

    return events;
  }

  static async getAllEvents(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      prisma.communityEvent.findMany({
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { eventDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.communityEvent.count(),
    ]);

    return {
      events,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async toggleEvent(eventId: number) {
    const event = await prisma.communityEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const updated = await prisma.communityEvent.update({
      where: { id: eventId },
      data: {
        isActive: !event.isActive,
      },
    });

    return updated;
  }
}

export class WebhookService {
  static async createWebhook(data: {
    url: string;
    events: string[];
    secret?: string;
  }) {
    const webhook = await prisma.webhook.create({
      data: {
        url: data.url,
        events: data.events,
        secret: data.secret || this.generateSecret(),
      },
    });

    return webhook;
  }

  static async triggerWebhook(event: string, payload: any) {
    const webhooks = await prisma.webhook.findMany({
      where: {
        isActive: true,
      },
    });

    const triggered = [];

    for (const webhook of webhooks) {
      const events = webhook.events as string[];
      if (events.includes(event)) {
        // Send webhook request
        try {
          const signature = this.generateSignature(webhook.secret, payload);
          
          // In production, use fetch or axios to send POST request
          console.log(`[Webhook] Sending ${event} to ${webhook.url}`);
          
          triggered.push({
            webhookId: webhook.id,
            url: webhook.url,
            success: true,
          });
        } catch (error) {
          triggered.push({
            webhookId: webhook.id,
            url: webhook.url,
            success: false,
            error,
          });
        }
      }
    }

    return triggered;
  }

  static async getAllWebhooks(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [webhooks, total] = await Promise.all([
      prisma.webhook.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.webhook.count(),
    ]);

    return {
      webhooks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async toggleWebhook(webhookId: number) {
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const updated = await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        isActive: !webhook.isActive,
      },
    });

    return updated;
  }

  static async deleteWebhook(webhookId: number) {
    await prisma.webhook.delete({
      where: { id: webhookId },
    });

    return { message: 'Webhook deleted' };
  }

  private static generateSecret(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private static generateSignature(secret: string, payload: any): string {
    // Simple signature - in production use HMAC
    return Buffer.from(`${secret}:${JSON.stringify(payload)}`).toString('base64');
  }
}
