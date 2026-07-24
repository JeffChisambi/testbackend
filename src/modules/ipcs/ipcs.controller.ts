import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import * as svc from './ipcs.service';
import { sendSuccess } from '../../utils/response';

export async function list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, search } = req.query as Record<string, string>;
    sendSuccess(res, await svc.listIpcs({ page: +page, limit: +limit, search }), 'IPCs retrieved');
  } catch (err) { next(err); }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await svc.getIpcById(+req.params.id), 'IPC retrieved');
  } catch (err) { next(err); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await svc.createIpc(req.body), 'IPC created', 201);
  } catch (err) { next(err); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await svc.updateIpc(+req.params.id, req.body), 'IPC updated');
  } catch (err) { next(err); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await svc.deleteIpc(+req.params.id);
    sendSuccess(res, null, 'IPC deleted');
  } catch (err) { next(err); }
}
