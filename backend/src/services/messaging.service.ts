import { prisma } from '../config/database';

export class MessagingService {
  static async sendMessage(senderId: number, receiverId: number, content: string, propertyId?: number) {
    if (!content.trim()) {
      throw new Error('Message content cannot be empty');
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: content.trim(),
        propertyId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return message;
  }

  static async getConversations(userId: number) {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by conversation
    const conversations: Record<string, any> = {};
    messages.forEach(msg => {
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
      const key = otherUser.id.toString();
      
      if (!conversations[key]) {
        conversations[key] = {
          user: otherUser,
          lastMessage: msg,
          unreadCount: 0,
        };
      }
      
      if (msg.receiverId === userId && !msg.isRead) {
        conversations[key].unreadCount++;
      }
    });

    return Object.values(conversations).map((conv: any) => ({
      userId: conv.user.id,
      name: conv.user.name,
      email: conv.user.email,
      lastMessage: conv.lastMessage.content,
      lastMessageAt: conv.lastMessage.createdAt,
      unreadCount: conv.unreadCount,
    }));
  }

  static async getConversation(userId: number, otherUserId: number, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
            },
          },
          property: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.message.count({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
        },
      }),
    ]);

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return {
      messages: messages.reverse(),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getUnreadCount(userId: number) {
    const count = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });

    return { count };
  }

  static async markAsRead(messageId: number, userId: number) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.receiverId !== userId) {
      throw new Error('Message not found');
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    });

    return { message: 'Message marked as read' };
  }

  static async deleteMessage(messageId: number, userId: number) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.senderId !== userId) {
      throw new Error('Message not found');
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    return { message: 'Message deleted' };
  }
}
