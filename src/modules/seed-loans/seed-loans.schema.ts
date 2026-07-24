import { z } from 'zod';

export const IssueLoanSchema = z.object({
  farmerId: z.number().int().positive(),
  commodityId: z.number().int().positive(),
  loanAmount: z.number().positive(),
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional(),
});

export const RecordPaymentSchema = z.object({
  amount: z.number().positive(),
});

export type IssueLoanInput = z.infer<typeof IssueLoanSchema>;
