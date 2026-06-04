import z from 'zod';

export const RoleSchema = z.object({
  roleName: z.string().min(1, { message: 'Type a menu name first!' }),
  deletable: z.coerce.boolean().optional(),
});

export const UpdateRoleSchema = RoleSchema.extend({
  moduleIds: z.preprocess((val) => {
    if (typeof val === 'string') {
      return val.split(',').map(Number);
    }
    if (Array.isArray(val)) {
      return val.map(Number);
    }
    return val;
  }, z.array(z.number())),
  permissionIds: z.preprocess((val) => {
    if (typeof val === 'string') {
      return val.split(',').map(Number);
    }
    if (Array.isArray(val)) {
      return val.map(Number);
    }
    return val;
  }, z.array(z.number())),
});
