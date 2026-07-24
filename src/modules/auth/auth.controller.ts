import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import { loginUser, refreshTokens, logoutUser, getMe } from './auth.service';
import { sendSuccess, sendError } from '../../utils/response';
import { parseDuration } from '../../utils/token';
import { env } from '../../config/env';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const { accessToken, refreshToken, user } = await loginUser(email, password);

    res
      .cookie('access_token', accessToken, {
        ...COOKIE_OPTS,
        maxAge: parseDuration(env.JWT_ACCESS_EXPIRES_IN),
      })
      .cookie('refresh_token', refreshToken, {
        ...COOKIE_OPTS,
        maxAge: parseDuration(env.JWT_REFRESH_EXPIRES_IN),
        path: '/api/v1/auth',
      });

    sendSuccess(res, { user, accessToken }, 'Login successful');
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token: string | undefined = req.cookies?.refresh_token ?? req.body?.refresh_token;
    if (!token) { sendError(res, 'Refresh token required', 400); return; }

    const { accessToken, refreshToken } = await refreshTokens(token);

    res
      .cookie('access_token', accessToken, {
        ...COOKIE_OPTS,
        maxAge: parseDuration(env.JWT_ACCESS_EXPIRES_IN),
      })
      .cookie('refresh_token', refreshToken, {
        ...COOKIE_OPTS,
        maxAge: parseDuration(env.JWT_REFRESH_EXPIRES_IN),
        path: '/api/v1/auth',
      });

    sendSuccess(res, { accessToken }, 'Token refreshed');
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token: string | undefined = req.cookies?.refresh_token ?? req.body?.refresh_token;
    if (token) await logoutUser(token);

    res.clearCookie('access_token').clearCookie('refresh_token', { path: '/api/v1/auth' });
    sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await getMe(req.user!.userId);
    sendSuccess(res, user, 'User profile retrieved');
  } catch (err) {
    next(err);
  }
}
