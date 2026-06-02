import { z } from 'zod';

export const UserQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),

  limit: z.coerce.number().int().positive().default(10),

  order: z
    .enum(['id', 'purchaseNo', 'createdAt', 'customerId', 'grandTotal'])
    .default('createdAt'),

  direction: z.enum(['asc', 'desc']).default('desc'),

  search: z.string().trim().optional(),

  gender: z.coerce.boolean().optional(),

  status: z.coerce.boolean().optional(),
});

export type UserQueryDto = z.infer<typeof UserQuerySchema>;
