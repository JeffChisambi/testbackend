import { z } from 'zod';
import { FarmerGender } from '@prisma/client';

const FarmerSyncSchema = z.object({
  uuid: z.string().uuid(),
  firstName: z.string().max(60),
  lastName: z.string().max(60),
  nrcId: z.string().max(50),
  phone: z.string().max(30),
  gender: z.nativeEnum(FarmerGender),
  dateOfBirth: z.string().datetime().optional().nullable(),
  address: z.string().optional(),
  village: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  clubId: z.number().int().positive().optional().nullable(),
  gpsLatitude: z.number().optional().nullable(),
  gpsLongitude: z.number().optional().nullable(),
  updatedAt: z.string().datetime().optional(),
});

const PurchaseSyncSchema = z.object({
  uuid: z.string().uuid(),
  farmerUuid: z.string().uuid(),             // reference by farmer UUID
  commodityId: z.number().int().positive(),
  varietyId: z.number().int().positive().optional().nullable(),
  grade: z.string().max(20).default('Grade A'),
  quantityKg: z.number().positive(),
  unitPrice: z.number().positive(),
  buyingCenterIpcId: z.number().int().positive(),
  gpsLatitude: z.number().optional().nullable(),
  gpsLongitude: z.number().optional().nullable(),
  manualLoanDeduction: z.number().min(0).optional().nullable(),
  updatedAt: z.string().datetime().optional(),
});

export const SyncPushSchema = z.object({
  deviceId: z.string().max(100).optional(),
  farmers: z.array(FarmerSyncSchema).default([]),
  purchases: z.array(PurchaseSyncSchema).default([]),
});

export type SyncPushInput = z.infer<typeof SyncPushSchema>;
