import z from 'zod';

export const MenuSchema = z.object({
  menuName: z.string().min(1, { message: 'Type a menu name first!' }),
  deletable: z.boolean().optional(),
});
