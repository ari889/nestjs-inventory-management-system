import { z } from 'zod';

export const SupplierReportQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),

  limit: z.coerce.number().int().positive().default(10),

  order: z
    .enum(['id', 'purchaseNo', 'createdAt', 'supplierId', 'grandTotal'])
    .default('createdAt'),

  direction: z.enum(['asc', 'desc']).default('desc'),

  supplierId: z.coerce
    .string()
    .transform((val) => Number(val))
    .pipe(z.number().positive())
    .optional(),

  purchaseNo: z.string().trim().optional(),

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

export type SupplierReportQueryDto = z.infer<typeof SupplierReportQuerySchema>;
