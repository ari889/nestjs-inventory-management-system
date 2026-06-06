import * as z from 'zod';

export const ExpenseSchema = z.object({
  expenseCategoryId: z.coerce.number({
    message: 'Expense category is required!',
  }),
  warehouseId: z.coerce.number({ message: 'Warehouse is required!' }),
  accountId: z.coerce.number({ message: 'Account is required!' }),
  amount: z
    .string({
      message: 'Amount is required!',
    })
    .refine((val) => !isNaN(Number(val)), {
      message: 'Amount must be a valid number',
    })
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val), {
      message: 'Only 2 decimal places allowed',
    }),
  note: z.string().max(255, { message: 'Max 255 characters!' }).nullable(),
  status: z.coerce.boolean({ message: 'Status is required!' }),
});

export type ExpenseDto = z.infer<typeof ExpenseSchema>;
