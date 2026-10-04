import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

// Custom error interface
export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: Record<string, unknown>;
}

// Extend Express Request to include requestId
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

/**
 * Structured error handler with request tracking and proper HTTP status codes
 */
export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  const requestId = req.id || 'unknown';
  const apiError = err as ApiError;

  // Determine status code
  let statusCode = apiError.statusCode || 500;
  let errorCode = apiError.code || 'INTERNAL_ERROR';
  let message = err.message || 'Internal server error';

  // Handle specific error types
  if (err.name === 'MulterError') {
    statusCode = 400;
    errorCode = 'UPLOAD_ERROR';
    message = `Upload error: ${err.message}`;
  } else if (err.message.includes('Only JPEG, PNG, and WebP')) {
    statusCode = 400;
    errorCode = 'INVALID_FILE_TYPE';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    message = 'Authentication required';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    errorCode = 'FORBIDDEN';
    message = 'Access denied';
  }

  // Structured logging
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  console.log(JSON.stringify({
    level: logLevel,
    timestamp: new Date().toISOString(),
    requestId,
    method: req.method,
    path: req.path,
    statusCode,
    errorCode,
    message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  }));

  // Response payload
  const response: Record<string, unknown> = {
    error: message,
    code: errorCode,
    requestId,
  };

  // Include details in development mode
  if (env.NODE_ENV === 'development' && apiError.details) {
    response.details = apiError.details;
  }

  // Send response
  res.status(statusCode).json(response);
};
