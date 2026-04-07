import { MemoryStorageFile } from '@blazity/nest-file-fastify';
import { z } from 'zod';

export const fileSchema = (
  allowedTypes: string[],
  fieldName: string,
  maxFileSize: number = 5 * 1024 * 1024,
) =>
  z
    .custom<MemoryStorageFile | undefined>(
      (val) => {
        if (val === undefined) return true;

        return (
          typeof val === 'object' &&
          val !== null &&
          Buffer.isBuffer((val as MemoryStorageFile).buffer)
        );
      },
      { message: `${fieldName} must be a valid file!` },
    )
    .refine(
      (file) => {
        if (!file) return true;
        return file.buffer.length <= maxFileSize;
      },
      {
        message: `${fieldName} must be less than 5MB!`,
      },
    )
    .refine(
      (file) => {
        if (!file) return true;
        return allowedTypes.includes(file.mimetype);
      },
      {
        message: `${fieldName} must be one of: ${allowedTypes
          .map((t) => t.split('/')[1])
          .join(', ')}`,
      },
    )
    .optional();
