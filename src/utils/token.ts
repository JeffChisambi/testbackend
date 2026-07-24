import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthPayload } from '../types';

export function signAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: Pick<AuthPayload, 'userId'>): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AuthPayload {
  return jwt.verify(token, env.JWT_SECRET) as AuthPayload;
}

export function verifyRefreshToken(token: string): Pick<AuthPayload, 'userId'> {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as Pick<AuthPayload, 'userId'>;
}

/** Parses "15m", "7d" → milliseconds for cookie maxAge */
export function parseDuration(str: string): number {
  const map: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) return 900_000; // fallback 15m
  return parseInt(match[1]) * (map[match[2]] ?? 1000);
}
