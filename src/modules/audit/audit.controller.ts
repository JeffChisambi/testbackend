import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import { listAuditLogs } from './audit.service';
import { sendSuccess } from '../../utils/response';

export async function list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, userId, action, entityType, from, to } = req.query as Record<string, string>;
    sendSuccess(res, await listAuditLogs({
      page: +page, limit: +limit,
      userId: userId ? +userId : undefined,
      action, entityType, from, to,
    }), 'Audit logs retrieved');
  } catch (err) { next(err); }
}
