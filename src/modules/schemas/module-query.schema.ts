import { z } from 'zod';

export const ModuleQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),

  limit: z.coerce.number().int().positive().default(10),

  order: z
    .enum([
      'id',
      'moduleName',
      'menuId',
      'type',
      'dividerTitle',
      'iconClass',
      'url',
      'order',
      'deletable',
      'createdAt',
    ])
    .default('createdAt'),

  direction: z.enum(['asc', 'desc']).default('desc'),

  search: z.string().trim().optional(),

  type: z.preprocess((value) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  }, z.boolean().optional()),
});

export type ModuleQueryDto = z.infer<typeof ModuleQuerySchema>;
