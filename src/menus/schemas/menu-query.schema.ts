import { z } from 'zod';

export const MenuQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),

  limit: z.coerce.number().int().positive().default(10),

  order: z
    .enum(['id', 'menuName', 'deletable', 'createdAt'])
    .default('createdAt'),

  direction: z.enum(['asc', 'desc']).default('desc'),

  search: z.string().trim().optional(),

  deletable: z.coerce.boolean().optional(),
});

export type MenuQueryDto = z.infer<typeof MenuQuerySchema>;
