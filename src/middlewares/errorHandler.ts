import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  logger.error(`${req.method} ${req.path} — ${err.message}`, { stack: err.stack });

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ success: false, message: 'A record with that value already exists.' });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Record not found.' });
      return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ success: false, message: 'Invalid data provided.' });
    return;
  }

  const status = (err as { status?: number }).status ?? 500;
  const message = status < 500 ? err.message : 'Internal server error';
  res.status(status).json({ success: false, message });
}
