import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
export function setupSwagger(
  app: INestApplication,
  configService: ConfigService,
) {
  const isSwaggerEnabled =
    configService.get<string>('SWAGGER_ENABLED') === 'true' &&
    configService.get<string>('NODE_ENV') !== 'production';

  if (!isSwaggerEnabled) return;

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Inventory Management System')
    .setDescription('The Inventory Management System API description')
    .setVersion('1.0')
    .addTag('IMS')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(
    configService.get<string>('SWAGGER_PATH') || 'api',
    app,
    document,
    {
      swaggerOptions: {
        persistAuthorization: true,
        filter: true,
        showRequestDuration: true,
      },
    },
  );
}
