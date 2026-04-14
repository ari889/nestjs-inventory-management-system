import * as z from 'zod';

export const HRMSettingSchema = z.object({
  checkIn: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'Enter a valid check-in time!',
  }),

  checkOut: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'Enter a valid check-out time!',
  }),
});

export type HRMSettingDto = z.infer<typeof HRMSettingSchema>;
