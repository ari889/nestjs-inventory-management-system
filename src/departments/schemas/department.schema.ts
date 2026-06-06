import * as z from 'zod';

export const DepartmentSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Department name is required' })
    .max(100, { message: 'Name too long' })
    .regex(/^[A-Za-z0-9\s]+$/, {
      message: 'Name can contain only letters, numbers, and spaces',
    }),
  status: z.coerce.boolean({ message: 'Status is required!' }),
});

export type DepartmentDto = z.infer<typeof DepartmentSchema>;
