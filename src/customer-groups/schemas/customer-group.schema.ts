import * as z from 'zod';

export const CustomerGroupSchema = z.object({
  groupName: z
    .string()
    .min(1, { message: 'Enter a valid customer group name!' })
    .regex(/^[A-Za-z ]+$/, {
      message: 'Name can contain only letters and spaces',
    }),
  percentage: z
    .number({
      message: 'Percentage is required!',
    })
    .min(0)
    .max(100),
  status: z.boolean({
    message: 'Status is required!',
  }),
});
