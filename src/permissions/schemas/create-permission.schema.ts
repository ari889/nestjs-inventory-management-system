import z from 'zod';

export const PermissionItemSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Enter a permission name!' })
    .regex(/^[A-Za-z ]+$/, {
      message: 'Name can contain only letters and spaces',
    }),

  slug: z
    .string()
    .min(1, { message: 'Enter a permission slug!' })
    .regex(/^[a-z-]+$/, {
      message: 'Slug can contain only lowercase letters and hyphens',
    }),

  deletable: z.boolean().optional(),
});

export const PermissionSchema = z.object({
  moduleId: z
    .number()
    .nullable()
    .refine((val) => val !== null && val > 0, {
      message: 'Please select a module!',
    }),
  permissions: z
    .array(PermissionItemSchema)
    .min(1, { message: 'Add at least one permission!' }),
});
