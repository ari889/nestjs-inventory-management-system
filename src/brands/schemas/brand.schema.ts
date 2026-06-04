import { fileSchema } from 'src/common/validators/global.validator';
import z from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const BrandSchema = z.object({
  title: z
    .string()
    .min(1, { message: 'Enter a valid brand title!' })
    .regex(/^[a-zA-Z ]+$/, {
      message: 'Title must contain only letters and spaces!',
    }),
  image: fileSchema(
    ['image/jpeg', 'image/png', 'image/gif'],
    'Brand Image',
    MAX_FILE_SIZE,
  ),
  status: z.boolean({
    message: 'Status is required!',
  }),
});

export type BrandDto = z.infer<typeof BrandSchema>;
