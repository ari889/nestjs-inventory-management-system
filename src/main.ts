import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import { setupSwagger } from './swagger';
import { VersioningType } from '@nestjs/common';
import fastifyHelmet from '@fastify/helmet';
import fastifyCsrfProtection from '@fastify/csrf-protection';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: process.env.NODE_ENV === 'development',
      trustProxy: true,
    }),
  );

  /**
   * register multipart plugin for file upload
   */
  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 2,
    },
  });

  /**
   * serve static files from uploads folder at /uploads route. This allows uploaded logos and favicons to be accessed via URLs like /uploads/logos/filename.jpg.
   */
  await app.register(fastifyStatic, {
    root: join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
    decorateReply: false,
  });

  /**
   * apply cors
   */
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL as string,
      process.env.SWAGGER_URL as string,
    ],
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'PATCH'],
  });

  /**
   * apply helmet
   */
  await app.register(fastifyHelmet, {
    crossOriginResourcePolicy: {
      policy: 'cross-origin',
    },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          process.env.FRONTEND_URL as string,
        ],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  });

  /**
   * csrf protection
   */
  await app.register(fastifyCsrfProtection);

  /**
   * set global prefix as /api/admin
   */
  app.setGlobalPrefix('api/admin');

  /**
   * enable api versioning
   */
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  /**
   * get service config
   */
  const configService = app.get(ConfigService);

  /**
   * initialize swagger
   */
  setupSwagger(app, configService);

  /**
   * change global exception resonse
   */
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
