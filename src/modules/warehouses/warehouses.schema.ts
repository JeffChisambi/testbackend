import { z } from 'zod';

export const CreateWarehouseSchema = z.object({
  name: z.string().max(100),
  ipcId: z.number().int().positive(),
  location: z.string().max(150),
  capacityTonnes: z.number().positive().default(1000),
  managerUserId: z.number().int().positive().optional().nullable(),
});

export const GrnSchema = z.object({
  warehouseId: z.number().int().positive(),
  purchaseId: z.number().int().positive().optional().nullable(),
  commodityId: z.number().int().positive(),
  varietyId: z.number().int().positive().optional().nullable(),
  quantityReceivedKg: z.number().positive(),
  grade: z.string().max(20).default('Grade A'),
  notes: z.string().optional(),
});

export const StockTransferSchema = z.object({
  sourceWarehouseId: z.number().int().positive(),
  destWarehouseId: z.number().int().positive(),
  commodityId: z.number().int().positive(),
  varietyId: z.number().int().positive().optional().nullable(),
  grade: z.string().max(20).default('Grade A'),
  quantityKg: z.number().positive(),
  referenceNo: z.string().max(50).optional(),
});

export type CreateWarehouseInput = z.infer<typeof CreateWarehouseSchema>;
export type GrnInput = z.infer<typeof GrnSchema>;
export type StockTransferInput = z.infer<typeof StockTransferSchema>;
