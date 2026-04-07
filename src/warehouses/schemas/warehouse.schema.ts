import * as z from 'zod';

export const WarehouseSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Enter a valid warehouse name!' })
    .regex(/^[A-Za-z ]+$/, {
      message: 'Name can contain only letters and spaces',
    }),
  email: z
    .string()
    .email({ message: 'Enter a valid email address!' })
    .nullable(),
  phone: z.string().min(1, { message: 'Phone number is required!' }).nullable(),
  address: z.string().min(1, { message: 'Address is required!' }).nullable(),
  status: z.boolean({
    message: 'Status is required!',
  }),
});
