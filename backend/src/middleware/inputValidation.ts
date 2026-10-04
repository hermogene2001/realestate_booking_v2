import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Validation middleware factory
 * Creates middleware that validates request body against a Zod schema
 */
export const validateRequest = (schema: ZodSchema) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          requestId: req.id,
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
      }
      next(error);
    }
  };

/**
 * Validation schemas for common operations
 */
export const validationSchemas = {
  // Auth schemas
  register: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    phone: z.string().min(10).max(20),
    password: z.string().min(8),
    role: z.enum(['TENANT', 'OWNER']),
    language: z.string().optional(),
  }),

  login: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),

  // Property schemas
  createProperty: z.object({
    title: z.string().min(5).max(200),
    description: z.string().min(20).max(5000),
    price: z.number().positive(),
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      address: z.string().optional(),
    }),
    amenities: z.array(z.string()).max(50).optional(),
    bedrooms: z.number().int().positive().optional(),
    bathrooms: z.number().int().positive().optional(),
    squareFeet: z.number().positive().optional(),
  }),

  // Booking schemas
  createBooking: z.object({
    propertyId: z.number().int().positive(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    numberOfGuests: z.number().int().positive(),
  }),

  // Review schemas
  createReview: z.object({
    bookingId: z.number().int().positive(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(10).max(1000),
  }),

  // Payment schemas
  initiatePayment: z.object({
    bookingId: z.number().int().positive(),
    amount: z.number().positive(),
    currency: z.enum(['USD', 'RWF', 'ETH']),
    method: z.enum(['MOMO', 'CARD', 'ETHEREUM']),
  }),

  // Message schemas
  sendMessage: z.object({
    recipientId: z.number().int().positive(),
    content: z.string().min(1).max(5000),
  }),

  // Search schemas
  searchProperties: z.object({
    query: z.string().min(1).max(200).optional(),
    minPrice: z.number().positive().optional(),
    maxPrice: z.number().positive().optional(),
    bedrooms: z.number().int().positive().optional(),
    amenities: z.array(z.string()).optional(),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
  }),

  // Pagination
  pagination: z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
  }),
};

/**
 * Sanitization utilities
 */
export const sanitize = {
  /**
   * Remove potentially dangerous characters from strings
   */
  string: (input: string): string => {
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .trim();
  },

  /**
   * Sanitize email addresses
   */
  email: (input: string): string => {
    return input.toLowerCase().trim();
  },

  /**
   * Sanitize URLs
   */
  url: (input: string): string => {
    try {
      const url = new URL(input);
      return url.toString();
    } catch {
      throw new Error('Invalid URL');
    }
  },

  /**
   * Sanitize object by removing null/undefined values
   */
  object: (obj: Record<string, any>): Record<string, any> => {
    return Object.entries(obj)
      .filter(([, value]) => value !== null && value !== undefined)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, any>);
  },
};

/**
 * Input validation middleware that sanitizes and validates
 */
export const validateAndSanitize = (schema: ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize input
      if (typeof req.body === 'object' && req.body !== null) {
        req.body = sanitize.object(req.body);
      }

      // Validate against schema
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          requestId: req.id,
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
      }
      next(error);
    }
  };
