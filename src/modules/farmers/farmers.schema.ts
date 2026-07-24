import { z } from 'zod';
import { FarmerGender, FarmerStatus } from '@prisma/client';

export const CreateFarmerSchema = z.object({
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
  fingerprintTemplate: z.string().optional().nullable(),
  crops: z.array(z.object({
    commodityId: z.number().int().positive(),
    varietyId: z.number().int().positive().optional().nullable(),
    acreageHectares: z.number().default(0),
    estimatedYieldKg: z.number().default(0),
    season: z.string().max(30).optional(),
  })).optional(),
});

export const UpdateFarmerSchema = CreateFarmerSchema.omit({ nrcId: true }).partial();

export type CreateFarmerInput = z.infer<typeof CreateFarmerSchema>;
export type UpdateFarmerInput = z.infer<typeof UpdateFarmerSchema>;
