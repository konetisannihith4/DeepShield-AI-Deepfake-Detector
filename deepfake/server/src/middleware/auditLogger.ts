import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { prisma } from '../db/prisma';

export const logAuditEvent = (action: string, resource: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id || null;
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown Agent';

      const details = {
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        query: req.query,
        timestamp: new Date().toISOString(),
      };

      // Async log to database (ignoring non-critical DB failures)
      prisma.auditLog.create({
        data: {
          userId,
          action,
          resource,
          details,
          ipAddress,
          userAgent,
        },
      }).catch((err: any) => {
        console.warn('[Audit Log Warning]: Could not persist audit log to MySQL DB:', err.message);
      });
    } catch (err) {
      console.warn('[Audit Log Error]:', err);
    }
    next();
  };
};
