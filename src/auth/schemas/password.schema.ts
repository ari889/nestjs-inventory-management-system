import { z } from 'zod';

export const ChangePasswordSchema = z
  .object({
    oldPassword: z
      .string({ message: 'Old password is required!' })
      .min(6, 'Old password must be at least 6 characters!'),

    newPassword: z
      .string({ message: 'New password is required!' })
      .min(6, 'New password must be at least 6 characters!'),

    reEnterPassword: z.string({
      message: 'Please re-enter your password!',
    }),
  })
  .refine((data) => data.newPassword === data.reEnterPassword, {
    message: 'Passwords do not match!',
    path: ['reEnterPassword'],
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: 'New password must be different from old password!',
    path: ['newPassword'],
  });

export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;
