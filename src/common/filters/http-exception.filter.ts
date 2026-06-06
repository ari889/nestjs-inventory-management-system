import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

interface HttpExceptionResponse {
  statusCode?: number;
  message?: string | string[];
  errors?: object;
}

interface ResponseObject {
  success: boolean;
  message: string;
  errors?: object;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    const status = exception.getStatus();
    const res = exception.getResponse() as HttpExceptionResponse;

    if (status === 404) {
      const customMessage =
        typeof res === 'object' && res.message && !Array.isArray(res.message)
          ? res.message
          : exception.message;

      return response.status(status).send({
        success: false,
        message: customMessage || "Requested resource doesn't exist!",
      });
    }

    const responseObject: ResponseObject = {
      success: false,
      message:
        typeof res === 'object' && res.message
          ? Array.isArray(res.message)
            ? res.message.join(', ')
            : res.message
          : exception.message || 'Something went wrong!',
      errors: res.errors,
    };

    return response.status(status).send(responseObject);
  }
}
