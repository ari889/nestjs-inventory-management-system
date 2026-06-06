import { z } from 'zod';

export const AttendanceQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),

  limit: z.coerce.number().int().positive().default(10),

  order: z
    .enum(['id', 'checkIn', 'checkOut', 'status', 'createdBy', 'createdAt'])
    .default('createdAt'),

  direction: z.enum(['asc', 'desc']).default('desc'),

  status: z
    .union([z.boolean(), z.string()])
    .transform((val) => {
      if (val === 'false' || val === false) return false;
      if (val === 'true' || val === true) return true;
      return undefined;
    })
    .optional(),
  createdBy: z.coerce.number().int().optional(),
  employeeId: z.coerce.number().int().optional(),
  date: z.preprocess((value) => {
    if (!value) return undefined;
    const str = value as string;
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [year, month, day] = str.split('-').map(Number);
      return new Date(Date.UTC(year, month - 1, day));
    }
    return new Date(str);
  }, z.date().optional()),
});

export type AttendanceQueryDto = z.infer<typeof AttendanceQuerySchema>;
