import { $Enums } from 'src/generated/prisma/client';
import { z } from 'zod';

const decimalString = (fieldName: string) =>
  z
    .string({ message: `${fieldName} is required!` })
    .refine((val) => !isNaN(Number(val)), {
      message: `${fieldName} must be a valid number`,
    })
    .refine((val) => Number(val) >= 0, {
      message: `${fieldName} must be a non-negative number`,
    })
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val), {
      message: `${fieldName} can have at most 2 decimal places`,
    });

export const PurchasePaymentSchema = z.object({
  accountId: z.coerce.number().int().positive(),
  purchaseId: z.coerce.number().int().positive(),
  amount: decimalString('Amount'),
  change: decimalString('Change').optional(),
  paymentMethod: z.enum(
    Object.values($Enums.PaymentMethod) as [string, ...string[]],
    { message: 'Please select a payment method!' },
  ),
  paymentNote: z.string().max(255).nullable().optional(),
});

export type PurchasePaymentDto = z.infer<typeof PurchasePaymentSchema>;
