import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodTypeAny } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodTypeAny) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const flattened = result.error.flatten();

      const fieldErrors: Record<string, string> = {};

      for (const key in flattened.fieldErrors) {
        const errorsArray = flattened.fieldErrors[key] as string[];
        if (Array.isArray(errorsArray) && errorsArray.length > 0) {
          fieldErrors[key] = errorsArray[0];
        }
      }

      throw new BadRequestException({
        success: result.success,
        errors: fieldErrors,
      });
    }

    return result.data;
  }
}
