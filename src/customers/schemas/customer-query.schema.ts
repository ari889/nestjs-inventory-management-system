import { z } from 'zod';

export const CustomerQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),

  limit: z.coerce.number().int().positive().default(10),

  order: z
    .enum([
      'id',
      'name',
      'companyName',
      'taxNumber',
      'email',
      'phone',
      'address',
      'city',
      'state',
      'postalCode',
      'country',
      'status',
      'createdBy',
      'createdAt',
    ])
    .default('createdAt'),

  direction: z.enum(['asc', 'desc']).default('desc'),

  search: z.string().trim().optional(),

  status: z
    .union([z.boolean(), z.string()])
    .transform((val) => {
      if (val === 'false' || val === false) return false;
      if (val === 'true' || val === true) return true;
      return undefined;
    })
    .optional(),
  createdBy: z.coerce.number().int().optional(),
  customerGroupId: z.coerce.number().int().optional(),
});

export type CustomerQueryDto = z.infer<typeof CustomerQuerySchema>;
