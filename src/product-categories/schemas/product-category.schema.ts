import * as z from 'zod';

export const ProductCategorySchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Product category name is required' })
    .max(100, { message: 'Name too long' })
    .regex(/^[A-Za-z0-9\s]+$/, {
      message: 'Name can contain only letters, numbers, and spaces',
    }),
  status: z.boolean({ message: 'Status is required!' }),
});

export type ProductCategoryDto = z.infer<typeof ProductCategorySchema>;
