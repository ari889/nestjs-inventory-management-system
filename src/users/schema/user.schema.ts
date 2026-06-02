import z from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1, { message: 'Enter a valid name!' }),
  email: z.string().email({ message: 'Enter a valid email!' }),
  phoneNo: z.string().optional(),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters!' }),
  roleId: z.coerce.number({ message: 'Select a valid role!' }),
  avatar: z.string().optional(),
  gender: z.coerce.boolean({ message: 'Select a valid gender!' }),
  status: z.coerce.boolean({ message: 'Select a valid status!' }),
});

export const updateUserSchema = createUserSchema.extend({
  password: createUserSchema.shape.password.optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
