import { z } from 'zod';

export const ProductQuantityAlertQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),

  limit: z.coerce.number().int().positive().default(10),

  order: z
    .enum(['id', 'purchaseNo', 'createdAt', 'prorductId', 'grandTotal'])
    .default('createdAt'),

  direction: z.enum(['asc', 'desc']).default('desc'),

  name: z.string().trim().optional(),

  code: z.string().trim().optional(),

  brandId: z.coerce
    .string()
    .transform((val) => Number(val))
    .pipe(z.number().positive())
    .optional(),

  categoryId: z.coerce
    .string()
    .transform((val) => Number(val))
    .pipe(z.number().positive())
    .optional(),
});

export type ProductQuantityAlertQueryDto = z.infer<
  typeof ProductQuantityAlertQuerySchema
>;
