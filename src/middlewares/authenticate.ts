import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyAccessToken } from '../utils/token';
import { sendError } from '../utils/response';

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    // Prefer HTTP-only cookie; fall back to Authorization header (mobile)
    let token: string | undefined = req.cookies?.access_token;
    if (!token) {
      const header = req.headers.authorization;
      if (header?.startsWith('Bearer ')) token = header.slice(7);
    }
    if (!token) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    req.user = verifyAccessToken(token);
    next();
  } catch {
    sendError(res, 'Invalid or expired token', 401);
  }
}
