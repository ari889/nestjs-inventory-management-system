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

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const status = exception.getStatus();
    const res = exception.getResponse() as HttpExceptionResponse;

    if (status === 404) {
      response.status(status).send({
        success: false,
        message: "Requested resource doesn't exist!",
      });
    }

    let responseObject: ResponseObject = {
      success: false,
      message: exception.message || 'Something went wrong!',
    };

    if (res.errors) {
      responseObject = { ...responseObject, errors: res.errors };
    }

    response.status(status).send(responseObject);
  }
}
