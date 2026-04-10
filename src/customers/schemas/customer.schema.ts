import * as z from 'zod';

const nullableString = (schema: z.ZodString) =>
  schema.nullable().or(z.literal('').transform(() => null));

export const CustomerSchema = z.object({
  customerGroupId: z.number({ message: 'Select a valid customer group!' }),
  name: z
    .string()
    .min(1, { message: 'Enter a valid customer name!' })
    .regex(/^[A-Za-z0-9% ]+$/, {
      message: 'Name can contain only letters and spaces',
    }),

  companyName: nullableString(
    z.string().regex(/^[A-Za-z0-9% ]+$/, {
      message: 'Name can contain only letters, numbers, % and spaces',
    }),
  ),

  taxNumber: nullableString(
    z.string().regex(/^[A-Za-z0-9% ]+$/, {
      message: 'Vat number can contain only letters, numbers, % and spaces',
    }),
  ),

  email: nullableString(
    z.string().email({ message: 'Enter a valid email address!' }),
  ),

  phone: nullableString(
    z.string().min(1, { message: 'Enter a valid phone number!' }),
  ),

  address: nullableString(
    z.string().min(1, { message: 'Enter a valid address!' }),
  ),

  city: nullableString(z.string().min(1, { message: 'Enter a valid city!' })),

  state: nullableString(z.string().min(1, { message: 'Enter a valid state!' })),

  postalCode: nullableString(
    z.string().min(1, { message: 'Enter a valid postal code!' }),
  ),

  country: nullableString(
    z.string().min(1, { message: 'Enter a valid country!' }),
  ),

  status: z.boolean({
    message: 'Status is required!',
  }),
});

export type CustomerDto = z.infer<typeof CustomerSchema>;
