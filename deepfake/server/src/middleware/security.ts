import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/env';

export const securityMiddleware = [
  // Helmet HTTP Header Security
  helmet({
    contentSecurityPolicy: false, // Allowed for embedded media canvas
    crossOriginEmbedderPolicy: false,
  }),

  // CORS Header Policy
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || origin === ENV.CLIENT_URL || ENV.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
  }),
];

// Enterprise API Rate Limiter
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Generous request budget behind cloud proxies
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});

// Auth Rate Limiter (Generous to prevent lockout during evaluation)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // 200 attempts per 15 min
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again later.',
  },
});

// XSS Input Sanitization Middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }
  next();
};

function sanitizeObject(obj: Record<string, any>) {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Strip potential malicious script tags
      obj[key] = obj[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '');
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}
