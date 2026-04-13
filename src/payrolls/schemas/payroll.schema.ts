import { Prisma } from 'src/generated/prisma/client';
import * as z from 'zod';

export const PayrollSchema = z.object({
  employeeId: z.number({
    message: 'Select a employee before saving!',
  }),
  accountId: z.number({ message: 'Account is required!' }),
  amount: z
    .string({
      message: 'Amount is required!',
    })
    .refine((val) => !isNaN(Number(val)), {
      message: 'Amount must be a valid number',
    })
    .refine((val) => Number(val) >= 0, {
      message: 'Amount must be positive',
    })
    .transform((val) => new Prisma.Decimal(val)),
  paymentMethods: z.enum(['CASH', 'CHEQUE', 'BANK'], {
    message: 'Payment method is required!',
  }),
});

export type PayrollDto = z.infer<typeof PayrollSchema>;
