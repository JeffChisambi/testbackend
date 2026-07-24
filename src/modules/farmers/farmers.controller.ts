import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import * as svc from './farmers.service';
import { sendSuccess } from '../../utils/response';

export async function list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, search, clubId, district, status } = req.query as Record<string, string>;
    sendSuccess(res, await svc.listFarmers({ page: +page, limit: +limit, search, clubId: clubId ? +clubId : undefined, district, status }), 'Farmers retrieved');
  } catch (err) { next(err); }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await svc.getFarmerById(+req.params.id), 'Farmer retrieved');
  } catch (err) { next(err); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await svc.createFarmer(req.body, req.user!.userId), 'Farmer registered', 201);
  } catch (err) { next(err); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await svc.updateFarmer(+req.params.id, req.body), 'Farmer updated');
  } catch (err) { next(err); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await svc.deleteFarmer(+req.params.id);
    sendSuccess(res, null, 'Farmer deleted');
  } catch (err) { next(err); }
}
