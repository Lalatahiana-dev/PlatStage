import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'dotenv/config';
console.log('JWT_SECRET =', process.env.JWT_SECRET);
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🔐 GLOBAL VALIDATION (important pour DTO)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove unknown fields
      forbidNonWhitelisted: true,
      transform: true, // convert payload to DTO class
    }),
  );
  // 📖 SWAGGER
  const config = new DocumentBuilder()
    .setTitle('PlatStage API')
    .setDescription('API pour la plateforme de stage')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // 🚀 CORS (frontend React/Vite)
  app.enableCors({
    origin: true,
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3001);
}

bootstrap();
