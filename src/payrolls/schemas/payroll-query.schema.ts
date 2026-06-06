import { z } from 'zod';

export const PayrollQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),

  limit: z.coerce.number().int().positive().default(10),

  order: z
    .enum(['id', 'amount', 'paymentMethods', 'createdAt'])
    .default('createdAt'),

  direction: z.enum(['asc', 'desc']).default('desc'),

  createdBy: z.coerce.number().int().optional(),
  employeeId: z.coerce.number().int().optional(),
  accountId: z.coerce.number().int().optional(),
  paymentMethods: z.enum(['CASH', 'CHEQUE', 'BANK']).optional(),
});

export type PayrollQueryDto = z.infer<typeof PayrollQuerySchema>;
