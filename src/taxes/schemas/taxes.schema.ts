import * as z from 'zod';

export const TaxSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Enter a valid tax name!' })
    .regex(/^[A-Za-z0-9% ]+$/, {
      message: 'Name can contain only letters and spaces',
    }),
  rate: z
    .number({
      message: 'Rate is required!',
    })
    .min(0)
    .max(100),
  status: z.boolean({
    message: 'Status is required!',
  }),
});

export type TaxDto = z.infer<typeof TaxSchema>;
