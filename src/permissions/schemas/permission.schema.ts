import z from 'zod';

export const PermissionSchema = z.object({
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

  deletable: z.coerce.boolean().optional(),
});

export const PermissionCreateSchema = z.object({
  moduleId: z.coerce
    .number()
    .nullable()
    .refine((val) => val !== null && val > 0, {
      message: 'Please select a module!',
    }),
  permissions: z
    .array(PermissionSchema)
    .min(1, { message: 'Add at least one permission!' }),
});

export type PermissionDto = z.infer<typeof PermissionSchema>;
export type PermissionCreateDto = z.infer<typeof PermissionCreateSchema>;
