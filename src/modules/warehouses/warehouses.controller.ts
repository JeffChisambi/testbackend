import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import * as svc from './warehouses.service';
import { sendSuccess } from '../../utils/response';

export async function list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, ipcId } = req.query as Record<string, string>;
    sendSuccess(res, await svc.listWarehouses({ page: +page, limit: +limit, ipcId: ipcId ? +ipcId : undefined }), 'Warehouses retrieved');
  } catch (err) { next(err); }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await svc.getWarehouseById(+req.params.id), 'Warehouse retrieved');
  } catch (err) { next(err); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await svc.createWarehouse(req.body), 'Warehouse created', 201);
  } catch (err) { next(err); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await svc.updateWarehouse(+req.params.id, req.body), 'Warehouse updated');
  } catch (err) { next(err); }
}

export async function receiveGoods(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await svc.receiveGoods(req.body, req.user!.userId), 'Goods received successfully', 201);
  } catch (err) { next(err); }
}

export async function transferStock(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await svc.transferStock(req.body, req.user!.userId), 'Stock transferred successfully');
  } catch (err) { next(err); }
}
