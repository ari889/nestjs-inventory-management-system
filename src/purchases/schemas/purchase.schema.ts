import { fileSchema } from 'src/common/validators/global.validator';
import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const purchaseStatusEnum = z.enum(
  ['PENDING', 'ORDERED', 'RECEIVED', 'PARTIAL', 'CANCELLED'],
  'Select a valid purchase status!',
);

export const paymentStatus = z.enum(
  ['PAID', 'PARTIAL', 'DUE'],
  'Select a valid payment status!',
);

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

const productSchema = z.object({
  id: z.number({ message: 'Select a product!' }).int().nonnegative().nullable(),
  productId: z.number({ message: 'Product ID is required!' }).int().positive(),
  unitId: z.number({ message: 'Select a unit!' }).int().positive(),
  taxId: z.number({ message: 'Select a tax!' }).int().positive().nullable(),
  qty: z.coerce.number({ message: 'Quantity is required!' }).int().positive(),
  received: z.coerce
    .number({ message: 'Received is required!' })
    .int()
    .nonnegative(),
  netUnitCost: decimalString('Net unit cost'),
  discount: decimalString('Discount'),
  taxRate: decimalString('Tax rate'),
  tax: decimalString('Tax'),
  total: decimalString('Total'),
});

const basePurchaseSchema = z.object({
  supplierId: z.coerce
    .number({ message: 'Select a supplier!' })
    .int()
    .positive(),

  warehouseId: z.coerce
    .number({ message: 'Select a warehouse!' })
    .int()
    .positive(),

  taxId: z.coerce.number().int().positive().optional().nullable(),

  orderTax: z
    .string({
      message: 'Order tax is required!',
    })
    .refine((val) => !isNaN(Number(val)), {
      message: 'Order tax must be a valid number',
    })
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val), {
      message: 'Only 2 decimal places allowed',
    })
    .optional()
    .nullable(),

  orderTaxRate: z.string('Order Tax Rate is required!').optional().nullable(),

  orderDiscount: z
    .string({
      message: 'Order Discount is required!',
    })
    .refine((val) => !isNaN(Number(val)), {
      message: 'Order Discounti must be a valid number',
    })
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val), {
      message: 'Only 2 decimal places allowed',
    })
    .optional()
    .nullable(),

  shippingCost: z
    .string({
      message: 'Shipping Cost is required!',
    })
    .refine((val) => !isNaN(Number(val)), {
      message: 'Shipping Cost must be a valid number',
    })
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val), {
      message: 'Only 2 decimal places allowed',
    })
    .optional()
    .nullable(),

  purchaseStatus: purchaseStatusEnum,

  paymentStatus: paymentStatus.optional(),

  products: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val) as unknown;
        } catch {
          return val;
        }
      }
      return val;
    },
    z.array(productSchema).min(1, { message: 'Add at least one product!' }),
  ),

  document: fileSchema(
    ['image/jpeg', 'image/png', 'image/gif'],
    'Brand Image',
    MAX_FILE_SIZE,
  ),

  note: z.string().optional().nullable(),
});

const purchaseCreatePaymentSchema = z.object({
  accountId: z.coerce.number().int().positive().nullable().optional(),
  amount: z.string().optional().nullable(),
  change: z.string().optional().nullable(),
  paymentMethod: z.enum(['CASH', 'CHEQUE', 'BANK']).optional().nullable(),
  paidAmount: decimalString('Paid Amount'),
});

const purchaseUpdatePaymentSchema = z.object({
  accountId: z.coerce.number().int().positive().nullable().optional(),
  amount: z.string().optional().nullable(),
  change: z.string().optional().nullable(),
  paymentMethod: z.enum(['CASH', 'CHEQUE', 'BANK']).optional().nullable(),
  paidAmount: decimalString('Paid Amount').optional().nullable(),
});

export const PurchaseCreateSchema = z
  .object({
    ...basePurchaseSchema.shape,
    ...purchaseCreatePaymentSchema.shape,
  })
  .superRefine((data, ctx) => {
    if (!data.paymentStatus) {
      return;
    }

    if (data.paymentStatus === 'PAID' || data.paymentStatus === 'PARTIAL') {
      if (!data.accountId) {
        ctx.addIssue({
          code: 'custom',
          path: ['accountId'],
          message: 'Account is required!',
        });
      }

      if (!data.amount) {
        ctx.addIssue({
          code: 'custom',
          path: ['amount'],
          message: 'Amount is required!',
        });
      }

      if (!data.change) {
        ctx.addIssue({
          code: 'custom',
          path: ['change'],
          message: 'Change is required!',
        });
      }

      if (!data.paymentMethod) {
        ctx.addIssue({
          code: 'custom',
          path: ['paymentMethod'],
          message: 'Payment method is required!',
        });
      }

      if (!data.paidAmount) {
        ctx.addIssue({
          code: 'custom',
          path: ['paidAmount'],
          message: 'Paid Amount is required!',
        });
      }
    }
  });

export const PurchaseUpdateSchema = z.object({
  ...basePurchaseSchema.shape,
  ...purchaseUpdatePaymentSchema.shape,
});

export type PurchaseCreateDto = z.infer<typeof PurchaseCreateSchema>;
export type PurchaseUpdateDto = z.infer<typeof PurchaseUpdateSchema>;
