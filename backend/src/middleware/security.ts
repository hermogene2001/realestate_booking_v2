import { Request, Response, NextFunction } from 'express';

// Blocked IPs list (should be in database/Redis in production)
const blockedIPs = new Set<string>();
const blockedUsers = new Set<number>();

export function ipBlocker(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  if (blockedIPs.has(ip)) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Your IP has been blocked',
    });
  }

  next();
}

export function userBanChecker(req: Request & { user?: { id: number } }, res: Response, next: NextFunction) {
  if (!req.user) {
    return next();
  }

  if (blockedUsers.has(req.user.id)) {
    return res.status(403).json({
      error: 'Account banned',
      message: 'Your account has been suspended',
    });
  }

  next();
}

export const securityUtils = {
  blockIP(ip: string) {
    blockedIPs.add(ip);
    console.log(`[Security] Blocked IP: ${ip}`);
  },

  unblockIP(ip: string) {
    blockedIPs.delete(ip);
    console.log(`[Security] Unblocked IP: ${ip}`);
  },

  banUser(userId: number) {
    blockedUsers.add(userId);
    console.log(`[Security] Banned user: ${userId}`);
  },

  unbanUser(userId: number) {
    blockedUsers.delete(userId);
    console.log(`[Security] Unbanned user: ${userId}`);
  },

  getBlockedIPs() {
    return Array.from(blockedIPs);
  },

  getBannedUsers() {
    return Array.from(blockedUsers);
  },
};
