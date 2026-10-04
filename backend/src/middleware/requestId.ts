import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to add unique request ID for tracking and debugging
 * Useful for correlating logs and tracing requests through the system
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check if request already has an ID (from upstream proxy)
  const existingId = req.headers['x-request-id'] as string;
  
  if (existingId) {
    req.id = existingId;
  } else {
    // Generate new request ID: timestamp-random
    req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Add request ID to response headers for client tracking
  res.setHeader('X-Request-ID', req.id);
  
  next();
};
