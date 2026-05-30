import { z } from 'zod';

export const MonthlySaleQuerySchema = z.object({
  warehouseId: z
    .string()
    .transform((val) => Number(val))
    .pipe(z.number().positive())
    .optional(),

  year: z
    .string()
    .transform((val) => Number(val))
    .pipe(z.number().min(2000).max(2100))
    .optional(),
});

export type MonthlySaleQueryDto = z.infer<typeof MonthlySaleQuerySchema>;
