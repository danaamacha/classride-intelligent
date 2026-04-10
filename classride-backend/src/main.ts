import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe — validates all DTOs automatically
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,        // strips unknown fields (prevents mass assignment)
    forbidNonWhitelisted: true, // throws error if unknown fields are sent
    transform: true,        // auto-transforms types (string → number etc)
  }));

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();