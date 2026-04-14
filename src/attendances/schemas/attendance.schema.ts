import * as z from 'zod';

export const AttendanceSchema = z.object({
  employeeId: z.coerce
    .number({ message: 'Select a valid employee!' })
    .min(1, { message: 'Select an employee!' }),

  date: z.coerce.date({ message: 'Select a valid date!' }),

  checkIn: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'Enter a valid check-in time!',
  }),

  checkOut: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
      message: 'Enter a valid check-out time!',
    })
    .nullable()
    .optional(),

  status: z.coerce.boolean({
    message: 'Status is required!',
  }),
});

export type AttendanceDto = z.infer<typeof AttendanceSchema>;
