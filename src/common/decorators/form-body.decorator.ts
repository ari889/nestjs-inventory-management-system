import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

export const FormBody = createParamDecorator(
  async (_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();

    /**
     * If already parsed as JSON (from Next.js)
     */
    if (request.body && typeof request.body === 'object') {
      return request.body;
    }

    /**
     * If multipart (from Swagger), manually parse fields
     */
    if (request.isMultipart()) {
      const fields: Record<string, unknown> = {};
      const parts = request.parts();

      for await (const part of parts) {
        if (part.type === 'field') {
          fields[part.fieldname] = part.value;
        }
      }

      return fields;
    }

    return request.body;
  },
);
