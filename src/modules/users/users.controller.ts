import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import * as svc from './users.service';
import { sendSuccess } from '../../utils/response';

export async function list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, search, role } = req.query as Record<string, string>;
    const result = await svc.listUsers({ page: +page, limit: +limit, search, role });
    sendSuccess(res, result, 'Users retrieved');
  } catch (err) { next(err); }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await svc.getUserById(+req.params.id);
    sendSuccess(res, user, 'User retrieved');
  } catch (err) { next(err); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await svc.createUser(req.body);
    sendSuccess(res, user, 'User created', 201);
  } catch (err) { next(err); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await svc.updateUser(+req.params.id, req.body);
    sendSuccess(res, user, 'User updated');
  } catch (err) { next(err); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await svc.deleteUser(+req.params.id);
    sendSuccess(res, null, 'User deleted');
  } catch (err) { next(err); }
}

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await svc.changePassword(req.user!.userId, req.body.currentPassword, req.body.newPassword);
    sendSuccess(res, null, 'Password changed successfully');
  } catch (err) { next(err); }
}
