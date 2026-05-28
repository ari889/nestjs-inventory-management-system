import { z } from 'zod';

const MAX_FILE_SIZE = 2 * 1024 * 1024;

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

export const saleProductSchema = z.object({
  id: z.number({ message: 'Select a product!' }).int().positive().nullable(),

  productId: z.number({ message: 'Product ID is required!' }).int().positive(),

  unitId: z.number({ message: 'Select a unit!' }).int().positive(),

  taxId: z.number({ message: 'Select a tax!' }).int().positive().nullable(),

  netUnitPrice: decimalString('Unit Price'),

  qty: z.coerce.number({ message: 'Quantity is required!' }).int().positive(),

  discount: decimalString('Discount'),

  taxRate: decimalString('Tax rate'),

  tax: decimalString('Tax'),

  total: decimalString('Total'),
});

export type SaleProductSchemaType = z.infer<typeof saleProductSchema>;

const baseSaleSchema = z.object({
  customerId: z.coerce
    .number({ message: 'Select a customer!' })
    .int()
    .positive(),

  warehouseId: z.coerce
    .number({ message: 'Select a warehouse!' })
    .int()
    .positive(),

  taxId: z.coerce.number().int().positive().nullable(),

  orderTaxRate: decimalString('Order Tax Rate'),

  orderDiscount: decimalString('Order Discount').optional().nullable(),

  shippingCost: decimalString('Shipping Cost').optional().nullable(),

  saleStatus: z.coerce.boolean({
    message: 'Please select a sale status!',
  }),

  paymentStatus: paymentStatus.optional(),

  document: z
    .union([
      z.string().min(1, { message: 'Document is required!' }),
      z
        .instanceof(File, { message: 'Document is required!' })
        .refine((f) => f.size <= MAX_FILE_SIZE, {
          message: 'Document must be less than 2MB!',
        })
        .refine(
          (f) => ['image/jpeg', 'image/png', 'image/gif'].includes(f.type),
          {
            message: 'Document must be a .jpg, .jpeg, .gif, or .png file!',
          },
        ),
    ])
    .optional()
    .nullable(),

  note: z.string().optional().nullable(),

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
    z.array(saleProductSchema).min(1, { message: 'Add at least one product!' }),
  ),
});

const saleCreatePaymentSchema = z.object({
  accountId: z.coerce.number().int().positive().nullable().optional(),
  amount: z.string().optional().nullable(),
  change: z.string().optional().nullable(),
  paymentMethod: z.enum(['CASH', 'CHEQUE', 'BANK']).optional().nullable(),
  paidAmount: decimalString('Paid Amount'),
});

const saleUpdatePaymentSchema = z.object({
  accountId: z.coerce.number().int().positive().nullable().optional(),
  amount: z.string().optional().nullable(),
  change: z.string().optional().nullable(),
  paymentMethod: z.enum(['CASH', 'CHEQUE', 'BANK']).optional().nullable(),
  paidAmount: decimalString('Paid Amount').optional().nullable(),
});

export const SaleCreateSchema = z
  .object({
    ...baseSaleSchema.shape,
    ...saleCreatePaymentSchema.shape,
  })
  .superRefine((data, ctx) => {
    if (!data.saleStatus) return;

    if (!data.paymentStatus) {
      ctx.addIssue({
        code: 'custom',
        path: ['paymentStatus'],
        message: 'Payment status is required!',
      });
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

export const SaleUpdateSchema = z
  .object({
    ...baseSaleSchema.shape,
    ...saleUpdatePaymentSchema.shape,
  })
  .superRefine((data, ctx) => {
    if (data.saleStatus && !data.paymentStatus) {
      ctx.addIssue({
        code: 'custom',
        path: ['paymentStatus'],
        message: 'Payment status is required!',
      });
    }
  });

export type SaleCreateDto = z.infer<typeof SaleCreateSchema>;
export type SaleUpdateDto = z.infer<typeof SaleUpdateSchema>;
