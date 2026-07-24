import { z } from 'zod';
import { UserRole, UserStatus } from '@prisma/client';

export const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.nativeEnum(UserRole).default('registration_officer'),
  ipcId: z.number().int().positive().optional().nullable(),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(30).optional(),
  role: z.nativeEnum(UserRole).optional(),
  ipcId: z.number().int().positive().optional().nullable(),
  status: z.nativeEnum(UserStatus).optional(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
