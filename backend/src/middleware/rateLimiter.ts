import { Request, Response, NextFunction } from 'express';

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests, message = 'Too many requests, please try again later' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    // Get or create rate limit entry
    let entry = rateLimitStore.get(ip);

    if (!entry || now > entry.resetTime) {
      // Create new entry
      entry = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(ip, entry);
    } else {
      // Increment count
      entry.count++;
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));
    res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      return res.status(429).json({
        error: message,
        retryAfter: new Date(entry.resetTime).toISOString(),
      });
    }

    next();
  };
}

// Common rate limit configurations
export const rateLimits = {
  // General API: 100 requests per 15 minutes
  general: rateLimit({
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
  }),

  // Authentication: 10 requests per 15 minutes
  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,
    message: 'Too many authentication attempts, please try again later',
  }),

  // Payment: 20 requests per hour
  payment: rateLimit({
    windowMs: 60 * 60 * 1000,
    maxRequests: 20,
    message: 'Too many payment attempts, please try again later',
  }),

  // Search: 50 requests per 5 minutes
  search: rateLimit({
    windowMs: 5 * 60 * 1000,
    maxRequests: 50,
  }),

  // Messaging: 30 requests per 5 minutes
  messaging: rateLimit({
    windowMs: 5 * 60 * 1000,
    maxRequests: 30,
  }),
};
