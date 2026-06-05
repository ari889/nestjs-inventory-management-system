import { z } from 'zod';

export const ProductQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),

  limit: z.coerce.number().int().positive().default(10),

  order: z
    .enum([
      'id',
      'name',
      'code',
      'barcodeSymbology',
      'cost',
      'price',
      'qty',
      'alertQty',
      'taxMethod',
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
  taxMethod: z
    .union([z.boolean(), z.string()])
    .transform((val) => {
      if (val === 'false' || val === false) return false;
      if (val === 'true' || val === true) return true;
      return undefined;
    })
    .optional(),
  createdBy: z.coerce.number().int().optional(),
  brandId: z.coerce.number().int().optional(),
  categoryId: z.coerce.number().int().optional(),
  unitId: z.coerce.number().int().optional(),
  purchaseUnitId: z.coerce.number().int().optional(),
  saleUnitId: z.coerce.number().int().optional(),
  taxId: z.coerce.number().int().optional(),
});

export type ProductQueryDto = z.infer<typeof ProductQuerySchema>;
