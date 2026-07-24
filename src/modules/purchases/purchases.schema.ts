import { z } from 'zod';

export const CreatePurchaseSchema = z.object({
  uuid: z.string().uuid().optional(),                 // mobile-generated UUID (idempotency key)
  farmerId: z.number().int().positive(),
  commodityId: z.number().int().positive(),
  varietyId: z.number().int().positive().optional().nullable(),
  grade: z.string().max(20).default('Grade A'),
  quantityKg: z.number().positive(),
  unitPrice: z.number().positive(),
  buyingCenterIpcId: z.number().int().positive(),
  gpsLatitude: z.number().optional().nullable(),
  gpsLongitude: z.number().optional().nullable(),
  manualLoanDeduction: z.number().min(0).optional().nullable(),
});

export type CreatePurchaseInput = z.infer<typeof CreatePurchaseSchema>;
