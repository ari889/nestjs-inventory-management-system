import { fileSchema } from 'src/common/validators/global.validator';
import * as z from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const nullableString = (schema: z.ZodString) =>
  schema.nullable().or(z.literal('').transform(() => null));

export const EmployeeSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Enter a valid employee name!' })
    .regex(/^[A-Za-z0-9% ]+$/, {
      message: 'Name can contain only letters and spaces',
    }),
  image: fileSchema(
    ['image/jpeg', 'image/png', 'image/gif'],
    'Brand Image',
    MAX_FILE_SIZE,
  ),

  phone: z.string().min(1, { message: 'Enter a valid phone number!' }),
  address: z.string().min(1, { message: 'Enter a valid address!' }),
  city: z.string().min(1, { message: 'Enter a valid city!' }),
  state: z.string().min(1, { message: 'Enter a valid state!' }),
  zip: z.string().min(1, { message: 'Enter a valid zip code!' }),
  postalCode: nullableString(
    z.string().min(1, { message: 'Enter a valid postal code!' }),
  ),
  country: z.string().min(1, { message: 'Enter a valid country!' }),
  departmentId: z.coerce
    .number({ message: 'Select a valid department!' })
    .min(1, { message: 'Select a department!' }),
  status: z.coerce.boolean({
    message: 'Status is required!',
  }),
});

export type EmployeeDto = z.infer<typeof EmployeeSchema>;
