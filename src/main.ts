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

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: process.env.NODE_ENV === 'development',
      trustProxy: true,
    }),
  );

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
  await app.register(fastifyHelmet);

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

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
