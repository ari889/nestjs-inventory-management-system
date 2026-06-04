import * as z from 'zod';

export const UnitSchema = z.object({
  unitCode: z
    .string()
    .min(1, { message: 'Enter a valid unit code!' })
    .regex(/^[A-Za-z0-9]+$/, {
      message: 'Unit code can contain only letters and numbers',
    }),
  unitName: z
    .string()
    .min(1, { message: 'Enter a valid unit name!' })
    .regex(/^[A-Za-z0-9 ]+$/, {
      message: 'Unit name can contain only letters, numbers, and spaces',
    }),
  baseUnitId: z.number().nullable(),
  operator: z
    .string()
    .min(1, { message: 'Enter a valid operator!' })
    .regex(/^[*/+-]+$/, {
      message: 'Operator can contain only *, /, +, -',
    }),
  operationValue: z
    .number({
      message: 'Operation value is required!',
    })
    .positive({ message: 'Operation value must be a positive number' })
    .refine((val) => Number(val.toFixed(2)) === val, {
      message: 'Maximum 2 decimal places allowed',
    }),
  status: z.boolean({
    message: 'Status is required!',
  }),
});

export type UnitDto = z.infer<typeof UnitSchema>;
