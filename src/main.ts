import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import { json } from 'express';
import { AppModule } from './app.module';
import { winstonConfig } from './config/winston.config';
import { loggingMiddleware } from './commons/middleware/logging.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });

  // Límite por defecto de express (100kb) se queda corto para los documentos PDF en base64
  // que sube "Agregar Documento" en Programaciones (hasta ~8MB de archivo real).
  app.use(json({ limit: '12mb' }));

  // Middleware, no interceptor: corre antes que los Guards (ver comentario en el archivo),
  // así queda registrada toda petición, incluidas las rechazadas por autenticación.
  app.use(loggingMiddleware);

  // Cada ambiente define sus propios orígenes permitidos vía CORS_ORIGINS (lista separada
  // por comas) — evita tener que tocar código y volver a desplegar solo por esto.
  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('TSpine API')
    .setDescription('Sistema TSpine 1.0')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Servidor corriendo en http://localhost:${port}/api/docs`);
}

bootstrap();
