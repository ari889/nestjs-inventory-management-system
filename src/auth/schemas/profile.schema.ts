import { fileSchema } from 'src/common/validators/global.validator';
import * as z from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 2MB

export const ProfileSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Enter a valid name!' })
    .regex(/^[a-zA-Z ]+$/, {
      message: 'Name must contain only letters and spaces!',
    }),
  avatar: fileSchema(
    ['image/jpeg', 'image/png', 'image/gif'],
    'Brand Image',
    MAX_FILE_SIZE,
  ),
  phoneNo: z.coerce.string().optional(),
  gender: z.coerce.boolean({ message: 'Select a valid gender!' }),
});

export type ProfileDto = z.infer<typeof ProfileSchema>;
