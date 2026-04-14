import * as z from 'zod';

export const AccountSchema = z.object({
  accountNo: z
    .string()
    .min(1, { message: 'Account number is required' })
    .max(50, { message: 'Account number too long' })
    .regex(/^[A-Za-z0-9\-_/]+$/, {
      message: 'Invalid account number format',
    }),

  name: z
    .string()
    .min(1, { message: 'Account name is required' })
    .max(100, { message: 'Name too long' })
    .regex(/^[A-Za-z0-9\s]+$/, {
      message: 'Name can contain only letters, numbers, and spaces',
    }),
  initialBalance: z
    .string({
      message: 'Current balance is required!',
    })
    .refine((val) => !isNaN(Number(val)), {
      message: 'Current balance must be a valid number',
    })
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val), {
      message: 'Only 2 decimal places allowed',
    }),

  note: z
    .string()
    .max(255, { message: 'Max 255 characters!' })
    .optional()
    .nullable(),
  status: z.boolean({ message: 'Status is required!' }),
});

export type AccountDto = z.infer<typeof AccountSchema>;
