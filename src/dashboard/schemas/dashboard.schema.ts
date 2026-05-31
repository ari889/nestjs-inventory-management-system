import { z } from 'zod';

export const DashboardQuerySchema = z.object({
  range: z
    .enum(['today', 'thisWeek', 'thisMonth', 'thisYear'])
    .default('thisYear'),
});

export type DashboaradQueryDto = z.infer<typeof DashboardQuerySchema>;
