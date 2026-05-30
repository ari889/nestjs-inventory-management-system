import { z } from 'zod';

export const DailyQuerySchema = z.object({
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

export type DailyQueryDto = z.infer<typeof DailyQuerySchema>;
