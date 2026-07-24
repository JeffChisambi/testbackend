import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const RefreshSchema = z.object({
  // refresh_token can also come from cookie — body fallback for mobile
  refresh_token: z.string().optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
