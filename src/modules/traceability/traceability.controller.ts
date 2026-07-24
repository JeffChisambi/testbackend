import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import { traceByRef } from './traceability.service';
import { sendSuccess, sendError } from '../../utils/response';

export async function trace(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { query } = req.query as { query?: string };
    if (!query) { sendError(res, 'Query parameter is required', 400); return; }
    const result = await traceByRef(query.trim());
    if (!result) { sendError(res, 'No record found for the given reference', 404); return; }
    sendSuccess(res, result, 'Traceability data retrieved');
  } catch (err) { next(err); }
}
