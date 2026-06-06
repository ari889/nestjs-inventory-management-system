import { z } from 'zod';

export const ExpenseQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),

  limit: z.coerce.number().int().positive().default(10),

  order: z
    .enum(['id', 'amount', 'status', 'createdBy', 'createdAt'])
    .default('createdAt'),

  direction: z.enum(['asc', 'desc']).default('desc'),

  status: z
    .union([z.boolean(), z.string()])
    .transform((val) => {
      if (val === 'false' || val === false) return false;
      if (val === 'true' || val === true) return true;
      return undefined;
    })
    .optional(),
  createdBy: z.coerce.number().int().optional(),
  expenseCategoryId: z.coerce.number().int().optional(),
  warehouseId: z.coerce.number().int().optional(),
  accountId: z.coerce.number().int().optional(),
});

export type ExpenseQueryDto = z.infer<typeof ExpenseQuerySchema>;
