import * as z from 'zod';

export const ExpenseSchema = z.object({
  expenseCategoryId: z.number({
    message: 'Expense category is required!',
  }),
  warehouseId: z.number({ message: 'Warehouse is required!' }),
  accountId: z.number({ message: 'Account is required!' }),
  amount: z
    .number({ message: 'Amount is required!' })
    .refine((val) => !isNaN(Number(val)), {
      message: 'Amount must be a valid number',
    })
    .transform((val) => Number(val)),
  note: z.string().max(255, { message: 'Max 255 characters!' }).nullable(),
  status: z.boolean({ message: 'Status is required!' }),
});

export type ExpenseDto = z.infer<typeof ExpenseSchema>;
