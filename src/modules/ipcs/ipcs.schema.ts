import { z } from 'zod';

export const CreateIpcSchema = z.object({
  code: z.string().max(20),
  name: z.string().max(100),
  region: z.string().max(50),
  location: z.string().max(150).optional(),
});

export const UpdateIpcSchema = CreateIpcSchema.partial();
export type CreateIpcInput = z.infer<typeof CreateIpcSchema>;
