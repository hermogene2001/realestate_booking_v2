import { Request } from 'express';
import { prisma } from '../config/database';

/**
 * Audit Log Service
 * Tracks sensitive operations for security and compliance
 */
export class AuditLogService {
  /**
   * Log a user action
   */
  static async log(
    userId: number,
    action: string,
    details: Record<string, any>,
    req?: Request
  ): Promise<void> {
    try {
      // Note: Requires AuditLog model in Prisma schema
      // Add this to schema.prisma:
      /*
      model AuditLog {
        id        Int     @id @default(autoincrement())
        userId    Int
        action    String
        details   Json
        ipAddress String?
        userAgent String?
        timestamp DateTime @default(now())
        
        user User @relation(fields: [userId], references: [id], onDelete: Cascade)
        
        @@index([userId])
        @@index([timestamp])
      }
      */

      const ipAddress = this.getClientIp(req);
      const userAgent = req?.get('user-agent');

      console.log(JSON.stringify({
        level: 'audit',
        timestamp: new Date().toISOString(),
        userId,
        action,
        details,
        ipAddress,
        userAgent,
        requestId: req?.id,
      }));

      // Uncomment when AuditLog model is added to schema
      /*
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          details,
          ipAddress,
          userAgent,
        },
      });
      */
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Log authentication event
   */
  static async logAuth(
    userId: number,
    action: 'LOGIN' | 'LOGOUT' | 'REGISTER' | 'PASSWORD_CHANGE' | 'MFA_ENABLED' | 'MFA_DISABLED',
    req?: Request,
    success: boolean = true
  ): Promise<void> {
    await this.log(userId, `AUTH_${action}`, { success }, req);
  }

  /**
   * Log payment event
   */
  static async logPayment(
    userId: number,
    action: 'PAYMENT_INITIATED' | 'PAYMENT_CONFIRMED' | 'PAYMENT_FAILED' | 'REFUND_ISSUED',
    details: Record<string, any>,
    req?: Request
  ): Promise<void> {
    await this.log(userId, action, details, req);
  }

  /**
   * Log property event
   */
  static async logProperty(
    userId: number,
    action: 'PROPERTY_CREATED' | 'PROPERTY_UPDATED' | 'PROPERTY_DELETED' | 'PROPERTY_LISTED' | 'PROPERTY_DELISTED',
    details: Record<string, any>,
    req?: Request
  ): Promise<void> {
    await this.log(userId, action, details, req);
  }

  /**
   * Log wallet event
   */
  static async logWallet(
    userId: number,
    action: 'WALLET_CREATED' | 'WALLET_LINKED' | 'WALLET_UNLINKED' | 'PRIVATE_KEY_EXPORTED',
    details: Record<string, any>,
    req?: Request
  ): Promise<void> {
    await this.log(userId, action, details, req);
  }

  /**
   * Log admin action
   */
  static async logAdmin(
    userId: number,
    action: string,
    targetUserId: number,
    details: Record<string, any>,
    req?: Request
  ): Promise<void> {
    await this.log(userId, `ADMIN_${action}`, {
      targetUserId,
      ...details,
    }, req);
  }

  /**
   * Log security event
   */
  static async logSecurity(
    userId: number | null,
    action: string,
    details: Record<string, any>,
    req?: Request
  ): Promise<void> {
    if (userId) {
      await this.log(userId, `SECURITY_${action}`, details, req);
    } else {
      console.log(JSON.stringify({
        level: 'security',
        timestamp: new Date().toISOString(),
        action,
        details,
        ipAddress: this.getClientIp(req),
        userAgent: req?.get('user-agent'),
        requestId: req?.id,
      }));
    }
  }

  /**
   * Get client IP address from request
   */
  private static getClientIp(req?: Request): string | undefined {
    if (!req) return undefined;

    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress
    );
  }

  /**
   * Get audit logs for a user
   */
  static async getUserLogs(
    userId: number,
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    // Uncomment when AuditLog model is added
    /*
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });
    */
    return [];
  }

  /**
   * Get logs for specific action
   */
  static async getActionLogs(
    action: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    // Uncomment when AuditLog model is added
    /*
    return prisma.auditLog.findMany({
      where: { action },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });
    */
    return [];
  }

  /**
   * Get suspicious activity logs
   */
  static async getSuspiciousActivity(
    hours: number = 24
  ): Promise<any[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Uncomment when AuditLog model is added
    /*
    return prisma.auditLog.findMany({
      where: {
        timestamp: { gte: since },
        action: {
          in: [
            'SECURITY_FAILED_LOGIN',
            'SECURITY_SUSPICIOUS_IP',
            'SECURITY_RATE_LIMIT_EXCEEDED',
          ],
        },
      },
      orderBy: { timestamp: 'desc' },
    });
    */
    return [];
  }
}
