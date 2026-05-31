import { z } from 'zod';

export const StockQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),

  limit: z.coerce.number().int().positive().default(10),

  order: z.enum(['id', 'qty', 'createdAt']).default('createdAt'),

  direction: z.enum(['asc', 'desc']).default('desc'),

  warehouseId: z.coerce
    .string()
    .transform((val) => Number(val))
    .pipe(z.number().positive())
    .optional(),

  name: z.string().trim().optional(),
});

export type StockQueryDto = z.infer<typeof StockQuerySchema>;
