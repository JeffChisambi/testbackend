import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface AuthPayload {
  userId: number;
  email: string;
  role: UserRole;
  ipcId: number | null;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data?: T;
}

export function paginate(page = 1, limit = 20) {
  const p = Math.max(1, Number(page));
  const l = Math.min(100, Math.max(1, Number(limit)));
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
}
