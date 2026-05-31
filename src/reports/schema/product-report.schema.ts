import { z } from 'zod';

export const ProrductReportQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),

  limit: z.coerce.number().int().positive().default(10),

  order: z
    .enum(['id', 'purchaseNo', 'createdAt', 'prorductId', 'grandTotal'])
    .default('createdAt'),

  direction: z.enum(['asc', 'desc']).default('desc'),

  warehouseId: z.coerce
    .string()
    .transform((val) => Number(val))
    .pipe(z.number().positive())
    .optional(),

  from: z
    .string()
    .transform((val) => new Date(val))
    .pipe(z.date())
    .optional(),

  to: z
    .string()
    .transform((val) => new Date(val))
    .pipe(z.date())
    .optional(),
});

export type ProrductReportQueryDto = z.infer<typeof ProrductReportQuerySchema>;
