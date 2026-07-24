import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import * as svc from './sync.service';
import { sendSuccess } from '../../utils/response';

export async function push(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await svc.pushSync(req.body, req.user!.userId);
    sendSuccess(res, result, 'Sync completed');
  } catch (err) { next(err); }
}

export async function pull(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { last_sync_timestamp } = req.query as { last_sync_timestamp?: string };
    sendSuccess(res, await svc.pullSync(last_sync_timestamp), 'Sync data ready');
  } catch (err) { next(err); }
}

export async function status(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await svc.getSyncStatus(), 'Sync status');
  } catch (err) { next(err); }
}

export async function history(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = req.query as Record<string, string>;
    sendSuccess(res, await svc.getSyncHistory({ page: +page, limit: +limit }), 'Sync history');
  } catch (err) { next(err); }
}
