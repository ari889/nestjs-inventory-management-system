import z from 'zod';
import { fileSchema } from 'src/common/validators/global.validator';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const SettingsSchema = z.object({
  title: z
    .string()
    .min(1, { message: 'Enter a valid site title!' })
    .regex(/^[a-zA-Z ]+$/, {
      message: 'Title must contain only letters and spaces!',
    }),

  address: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === '' || val === undefined ? null : val)),

  currency_code: z
    .string()
    .min(1, { message: 'Currency code is required!' })
    .refine(
      (val) => {
        try {
          new Intl.NumberFormat('en', { style: 'currency', currency: val });
          return true;
        } catch {
          return false;
        }
      },
      { message: 'Must be a valid ISO 4217 currency code (e.g. USD, EUR)!' },
    ),

  currency_symbol: z
    .string()
    .min(1, { message: 'Currency symbol is required!' }),

  currency_position: z.enum(['prefix', 'postfix'] as const, {
    message: "Currency position must be 'prefix' or 'postfix'!",
  }),

  timezone: z
    .string()
    .min(1, { message: 'Timezone is required!' })
    .refine(
      (val) => {
        try {
          Intl.DateTimeFormat(undefined, { timeZone: val });
          return true;
        } catch {
          return false;
        }
      },
      { message: 'Must be a valid IANA timezone (e.g. America/New_York)!' },
    ),

  date_format: z
    .string()
    .min(1, { message: 'Date format is required!' })
    .refine(
      (val) =>
        [
          'MM/DD/YYYY',
          'DD/MM/YYYY',
          'YYYY-MM-DD',
          'DD-MM-YYYY',
          'MM-DD-YYYY',
          'YYYY/MM/DD',
          'DD.MM.YYYY',
          'MMMM DD, YYYY',
          'MMM DD, YYYY',
          'DD MMMM YYYY',
        ].includes(val),
      { message: 'Must be a valid date format (e.g. MM/DD/YYYY, YYYY-MM-DD)!' },
    ),

  invoice_suffix: z
    .string()
    .min(1, { message: 'Invoice suffix is required!' })
    .regex(/^[A-Z-]+$/, {
      message:
        'Invoice suffix must contain only uppercase letters (A-Z) and hyphens (-)!',
    }),

  invoice_number: z.coerce
    .number({ message: 'Invoice number must be a number!' })
    .int({ message: 'Invoice number must be an integer!' })
    .min(1, { message: 'Invoice number must be greater than 0!' }),

  logo: fileSchema(
    ['image/jpeg', 'image/png', 'image/gif'],
    'Logo',
    MAX_FILE_SIZE,
  ),

  favicon: fileSchema(
    [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/x-icon',
      'image/vnd.microsoft.icon',
    ],
    'Favicon',
    MAX_FILE_SIZE,
  ),
});

export type SettingsSchemaType = z.infer<typeof SettingsSchema>;
