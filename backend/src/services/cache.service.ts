import { env } from '../config/env';

// Redis client (install redis package: npm install redis)
let redisClient: any = null;

export class CacheService {
  static async initialize() {
    try {
      // Check if Redis is configured
      if (!env.REDIS_URL) {
        console.log('[Cache] Redis not configured, using in-memory cache');
        return;
      }

      // Dynamic import to avoid errors if redis not installed
      const redis = await import('redis');
      redisClient = redis.createClient({
        url: env.REDIS_URL,
      });

      await redisClient.connect();
      console.log('[Cache] Redis connected successfully');
    } catch (error) {
      console.log('[Cache] Redis not available, using fallback');
      redisClient = null;
    }
  }

  // In-memory fallback cache
  private static memoryCache = new Map<string, { value: any; expiry: number }>();

  static async get(key: string): Promise<any> {
    try {
      if (redisClient) {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
      }

      // Fallback to memory cache
      const cached = this.memoryCache.get(key);
      if (cached && cached.expiry > Date.now()) {
        return cached.value;
      }

      // Expired
      this.memoryCache.delete(key);
      return null;
    } catch (error) {
      console.error('[Cache] Get error:', error);
      return null;
    }
  }

  static async set(key: string, value: any, ttlSeconds: number = 3600) {
    try {
      if (redisClient) {
        await redisClient.set(key, JSON.stringify(value), {
          EX: ttlSeconds,
        });
        return;
      }

      // Fallback to memory cache
      this.memoryCache.set(key, {
        value,
        expiry: Date.now() + (ttlSeconds * 1000),
      });
    } catch (error) {
      console.error('[Cache] Set error:', error);
    }
  }

  static async delete(key: string) {
    try {
      if (redisClient) {
        await redisClient.del(key);
        return;
      }

      // Fallback to memory cache
      this.memoryCache.delete(key);
    } catch (error) {
      console.error('[Cache] Delete error:', error);
    }
  }

  static async clear() {
    try {
      if (redisClient) {
        await redisClient.flushAll();
        return;
      }

      // Fallback to memory cache
      this.memoryCache.clear();
    } catch (error) {
      console.error('[Cache] Clear error:', error);
    }
  }

  // Cache wrappers for common operations
  static async cachePropertyList(key: string, properties: any[], ttlSeconds: number = 300) {
    await this.set(`properties:${key}`, properties, ttlSeconds);
  }

  static async getCachedPropertyList(key: string): Promise<any[]> {
    return this.get(`properties:${key}`);
  }

  static async invalidatePropertyCache(propertyId?: number) {
    if (propertyId) {
      await this.delete(`properties:${propertyId}`);
    } else {
      // Clear all property caches
      const keys = Array.from(this.memoryCache.keys()).filter(k => k.startsWith('properties:'));
      keys.forEach(k => this.memoryCache.delete(k));
    }
  }

  static async cacheUser(key: string, user: any, ttlSeconds: number = 600) {
    await this.set(`user:${key}`, user, ttlSeconds);
  }

  static async getCachedUser(key: string): Promise<any> {
    return this.get(`user:${key}`);
  }

  static async invalidateUserCache(userId: number) {
    await this.delete(`user:${userId}`);
  }
}

// Cache middleware
export function cacheMiddleware(ttlSeconds: number = 3600) {
  return async (req: any, res: any, next: any) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl || req.url;

    try {
      const cached = await CacheService.get(key);
      if (cached) {
        return res.json(cached);
      }

      // Override res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        if (res.statusCode === 200) {
          CacheService.set(key, body, ttlSeconds);
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      next();
    }
  };
}
