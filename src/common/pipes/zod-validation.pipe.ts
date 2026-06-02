import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodTypeAny } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodTypeAny) {}

  transform(value: unknown) {
    const unwrapped = this.unwrapMultipart(value);
    const result = this.schema.safeParse(unwrapped);

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
        success: false,
        message: 'Validation failed!',
        errors: fieldErrors,
      });
    }

    return result.data;
  }

  private unwrapMultipart(value: unknown): unknown {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return value;
    }

    const obj = value as Record<string, unknown>;
    const unwrapped: Record<string, unknown> = {};

    for (const key of Object.keys(obj)) {
      const field = obj[key];

      if (
        field &&
        typeof field === 'object' &&
        !Array.isArray(field) &&
        'value' in field
      ) {
        unwrapped[key] = (field as { value: unknown }).value;
      } else {
        unwrapped[key] = field;
      }
    }

    return unwrapped;
  }
}
