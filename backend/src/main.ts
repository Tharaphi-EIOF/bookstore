import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppConfigService } from './config/config.service';
import express from 'express';

async function bootstrap() {
  // The bootstrap stays intentionally thin: app-wide middleware, validation, docs,
  // and environment-driven runtime configuration all happen here.
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Allow larger rich-text/blog payloads (e.g. embedded base64 images)
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Centralized config keeps env access out of feature modules.
  const configService = app.get(AppConfigService);

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configuration
  if (configService.corsOrigin) {
    app.enableCors({
      origin: configService.corsOrigin,
      credentials: true,
    });
  }

  // Swagger documents the public API surface for the frontend and manual testing.
  const config = new DocumentBuilder()
    .setTitle(configService.swaggerTitle)
    .setDescription(configService.swaggerDescription)
    .setVersion(configService.swaggerVersion)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('books', 'Book management endpoints')
    .addTag('cart', 'Shopping cart endpoints')
    .addTag('orders', 'Order management endpoints')
    .addTag('users', 'User management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(configService.swaggerPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  console.log(
    `🚀 Application is running on: http://localhost:${configService.port}`,
  );
  console.log(
    `📚 Swagger documentation: http://localhost:${configService.port}/${configService.swaggerPath}`,
  );
  console.log(`🌍 Environment: ${configService.nodeEnv}`);

  await app.listen(configService.port);
}
void bootstrap();
