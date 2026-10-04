import jwt from 'jsonwebtoken';
import { env } from '../config/env';

/**
 * Token Blacklist Service
 * Manages blacklisted tokens for logout and token revocation
 * 
 * In production, use Redis for distributed caching:
 * - Faster lookups
 * - Shared across multiple server instances
 * - Automatic expiration
 */
export class TokenBlacklistService {
  // In-memory store (use Redis in production)
  private static blacklist = new Map<string, number>();

  /**
   * Add token to blacklist
   * @param token JWT token to blacklist
   * @param expiresAt Token expiration timestamp
   */
  static addToBlacklist(token: string, expiresAt: number): void {
    this.blacklist.set(token, expiresAt);

    // Schedule cleanup when token expires
    const timeUntilExpiry = expiresAt - Date.now();
    if (timeUntilExpiry > 0) {
      setTimeout(() => {
        this.blacklist.delete(token);
      }, timeUntilExpiry);
    }
  }

  /**
   * Check if token is blacklisted
   * @param token JWT token to check
   * @returns true if token is blacklisted
   */
  static isBlacklisted(token: string): boolean {
    if (!this.blacklist.has(token)) {
      return false;
    }

    const expiresAt = this.blacklist.get(token)!;
    if (Date.now() > expiresAt) {
      // Token has expired, remove from blacklist
      this.blacklist.delete(token);
      return false;
    }

    return true;
  }

  /**
   * Blacklist token from JWT payload
   * Extracts expiration from token and adds to blacklist
   */
  static blacklistFromToken(token: string): void {
    try {
      const decoded = jwt.decode(token) as { exp?: number };
      if (decoded?.exp) {
        // exp is in seconds, convert to milliseconds
        this.addToBlacklist(token, decoded.exp * 1000);
      }
    } catch (error) {
      console.error('Failed to decode token for blacklisting:', error);
    }
  }

  /**
   * Get blacklist statistics
   */
  static getStats(): {
    totalBlacklisted: number;
    activeBlacklisted: number;
  } {
    const now = Date.now();
    let activeCount = 0;

    for (const [, expiresAt] of this.blacklist.entries()) {
      if (expiresAt > now) {
        activeCount++;
      }
    }

    return {
      totalBlacklisted: this.blacklist.size,
      activeBlacklisted: activeCount,
    };
  }

  /**
   * Clear all expired tokens from blacklist
   */
  static clearExpired(): number {
    const now = Date.now();
    let removed = 0;

    for (const [token, expiresAt] of this.blacklist.entries()) {
      if (expiresAt <= now) {
        this.blacklist.delete(token);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Clear entire blacklist (use with caution)
   */
  static clearAll(): void {
    this.blacklist.clear();
  }
}

/**
 * Redis-backed Token Blacklist Service (for production)
 * Uncomment and use this when Redis is available
 */
/*
import { redis } from '../config/redis';

export class TokenBlacklistServiceRedis {
  private static readonly PREFIX = 'blacklist:';

  static async addToBlacklist(token: string, expiresAt: number): Promise<void> {
    const ttl = Math.ceil((expiresAt - Date.now()) / 1000);
    if (ttl > 0) {
      await redis.setex(`${this.PREFIX}${token}`, ttl, '1');
    }
  }

  static async isBlacklisted(token: string): Promise<boolean> {
    const result = await redis.get(`${this.PREFIX}${token}`);
    return result !== null;
  }

  static async blacklistFromToken(token: string): Promise<void> {
    try {
      const decoded = jwt.decode(token) as { exp?: number };
      if (decoded?.exp) {
        await this.addToBlacklist(token, decoded.exp * 1000);
      }
    } catch (error) {
      console.error('Failed to decode token for blacklisting:', error);
    }
  }

  static async clearAll(): Promise<void> {
    const keys = await redis.keys(`${this.PREFIX}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}
*/
