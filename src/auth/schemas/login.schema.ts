import z from 'zod';

export const LoginSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address!' }),
  password: z
    .string()
    .min(1, { message: 'Password is required!' })
    .min(6, { message: 'Password must be at least 6 characters!' }),
});

export type LoginUserDto = z.infer<typeof LoginSchema>;
