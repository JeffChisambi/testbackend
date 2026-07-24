import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AuthRequest } from '../types';
import { sendError } from '../utils/response';

/**
 * authorize(...roles) — RBAC middleware factory.
 * Usage: router.get('/path', authenticate, authorize('admin', 'ipc_manager'), handler)
 */
export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      sendError(res, 'Forbidden: insufficient permissions', 403);
      return;
    }
    next();
  };
}
