import { Request, Response } from 'express';
import { getDatabaseHealth } from '../../config/database';
import { sendSuccess } from '../../utils/response';

export async function healthCheck(req: Request, res: Response): Promise<void> {
  const db = await getDatabaseHealth();
  sendSuccess(res, {
    status: 'ok',
    database: db,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }, 'System healthy');
}
