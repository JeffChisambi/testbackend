import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import * as svc from './reports.service';
import { sendSuccess } from '../../utils/response';

export async function farmers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await svc.getFarmerReport(), 'Farmer report'); }
  catch (err) { next(err); }
}

export async function purchases(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { from, to, ipcId } = req.query as Record<string, string>;
    sendSuccess(res, await svc.getPurchaseReport({ from, to, ipcId: ipcId ? +ipcId : undefined }), 'Purchase report');
  } catch (err) { next(err); }
}

export async function loans(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await svc.getLoanReport(), 'Loan recovery report'); }
  catch (err) { next(err); }
}

export async function inventory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await svc.getInventoryReport(), 'Inventory report'); }
  catch (err) { next(err); }
}
