import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import * as svc from './purchases.service';
import { sendSuccess } from '../../utils/response';

export async function list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, farmerId, commodityId, ipcId, from, to } = req.query as Record<string, string>;
    sendSuccess(res, await svc.listPurchases({
      page: +page, limit: +limit,
      farmerId: farmerId ? +farmerId : undefined,
      commodityId: commodityId ? +commodityId : undefined,
      ipcId: ipcId ? +ipcId : undefined,
      from, to,
    }), 'Purchases retrieved');
  } catch (err) { next(err); }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await svc.getPurchaseById(+req.params.id), 'Purchase retrieved');
  } catch (err) { next(err); }
}

export async function getByReceipt(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await svc.getPurchaseByReceipt(req.params['ref'] as string), 'Purchase retrieved');
  } catch (err) { next(err); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await svc.createPurchase(req.body, req.user!.userId), 'Purchase recorded', 201);
  } catch (err) { next(err); }
}

export async function cancel(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await svc.cancelPurchase(+req.params.id), 'Purchase cancelled');
  } catch (err) { next(err); }
}
