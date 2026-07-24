import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import * as svc from './seed-loans.service';
import { sendSuccess } from '../../utils/response';

export async function list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, farmerId, status } = req.query as Record<string, string>;
    sendSuccess(res, await svc.listLoans({ page: +page, limit: +limit, farmerId: farmerId ? +farmerId : undefined, status }), 'Loans retrieved');
  } catch (err) { next(err); }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await svc.getLoanById(+req.params.id), 'Loan retrieved');
  } catch (err) { next(err); }
}

export async function issue(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await svc.issueLoan(req.body), 'Seed loan issued', 201);
  } catch (err) { next(err); }
}

export async function recordPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await svc.recordPayment(+req.params.id, req.body.amount), 'Payment recorded');
  } catch (err) { next(err); }
}

export async function markDefaulted(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await svc.markDefaulted(+req.params.id), 'Loan marked as defaulted');
  } catch (err) { next(err); }
}
