import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import * as svc from './inventory.service';
import { sendSuccess } from '../../utils/response';

export async function list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, warehouseId, commodityId } = req.query as Record<string, string>;
    sendSuccess(res, await svc.listInventory({
      page: +page, limit: +limit,
      warehouseId: warehouseId ? +warehouseId : undefined,
      commodityId: commodityId ? +commodityId : undefined,
    }), 'Inventory retrieved');
  } catch (err) { next(err); }
}

export async function lowStock(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = req.query as Record<string, string>;
    sendSuccess(res, await svc.getLowStockAlerts({ page: +page, limit: +limit }), 'Low stock alerts');
  } catch (err) { next(err); }
}

export async function movements(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, warehouseId, commodityId } = req.query as Record<string, string>;
    sendSuccess(res, await svc.listStockMovements({
      page: +page, limit: +limit,
      warehouseId: warehouseId ? +warehouseId : undefined,
      commodityId: commodityId ? +commodityId : undefined,
    }), 'Stock movements retrieved');
  } catch (err) { next(err); }
}
