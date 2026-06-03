import { z } from 'zod';

export const createModuleSchema = z
  .object({
    type: z.coerce.boolean({
      message: 'Please select a module type!',
    }),

    moduleName: z.string().optional(),
    dividerTitle: z.string().optional(),
    iconClass: z.string().optional(),

    url: z
      .string()
      .regex(/^\/[a-z0-9\-_/]*(\?[a-z0-9=&\-_]*)?$/i, {
        message:
          'URL can contain letters (a-z), numbers (0-9), /, -, _, and optional query parameters',
      })
      .optional(),

    order: z.coerce.number().min(1, {
      message: 'Enter a valid order!',
    }),

    parentId: z.coerce.number().nullable().optional(),

    target: z.enum(['_self', '_blank'], {
      message: 'Please select a target!',
    }),

    deletable: z.coerce.boolean({
      message: 'Please ensure that the module is deletable!',
    }),
  })
  .superRefine((data, ctx) => {
    if (data.type) {
      if (!data.dividerTitle?.trim()) {
        ctx.addIssue({
          path: ['dividerTitle'],
          code: z.ZodIssueCode.custom,
          message: 'Enter a valid divider title!',
        });
      }
    } else {
      if (!data.moduleName?.trim()) {
        ctx.addIssue({
          path: ['moduleName'],
          code: z.ZodIssueCode.custom,
          message: 'Enter a valid module name!',
        });
      }

      if (!data.iconClass?.trim()) {
        ctx.addIssue({
          path: ['iconClass'],
          code: z.ZodIssueCode.custom,
          message: 'Enter a valid icon class!',
        });
      }

      if (!data.url?.trim()) {
        ctx.addIssue({
          path: ['url'],
          code: z.ZodIssueCode.custom,
          message: 'Enter a valid url!',
        });
      }
    }
  });
