import { z } from 'zod';

export const CustomerReportQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),

  limit: z.coerce.number().int().positive().default(10),

  order: z
    .enum(['id', 'purchaseNo', 'createdAt', 'customerId', 'grandTotal'])
    .default('createdAt'),

  direction: z.enum(['asc', 'desc']).default('desc'),

  customerId: z.coerce
    .string()
    .transform((val) => Number(val))
    .pipe(z.number().positive())
    .optional(),

  saleNo: z.string().trim().optional(),

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

export type CustomerReportQueryDto = z.infer<typeof CustomerReportQuerySchema>;
