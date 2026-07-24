import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

/**
 * auditLog middleware factory — records an AuditLog row after a successful response.
 * Usage: router.post('/path', authenticate, auditLog('CREATE_FARMER', 'Farmer'), handler)
 */
export function auditLog(action: string, entityType?: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const originalJson = res.json.bind(res);

    res.json = (body: unknown) => {
      // Fire-and-forget after response — don't block the request
      if (res.statusCode < 400 && req.user) {
        prisma.auditLog
          .create({
            data: {
              userId: req.user.userId,
              action,
              entityType: entityType ?? null,
              entityId: (body as { data?: { id?: number } })?.data?.id ?? null,
              details: JSON.stringify({ method: req.method, path: req.path }),
              ipAddress: req.ip ?? null,
            },
          })
          .catch((err) => logger.error('AuditLog write failed', err));
      }
      return originalJson(body);
    };

    next();
  };
}
