import z from 'zod';

export const RoleSchema = z.object({
  roleName: z.string().min(1, { message: 'Type a menu name first!' }),
  deletable: z.boolean().optional(),
});
