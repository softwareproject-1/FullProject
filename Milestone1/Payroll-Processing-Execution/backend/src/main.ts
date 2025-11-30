import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // <-- 1. IMPORT

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- 2. ADD THIS LINE ---
  // This enables validation for all incoming DTOs
  app.useGlobalPipes(new ValidationPipe());

  // --- 3. ADD THIS LINE ---
  // Sets a global prefix for all routes (e.g., /api/v1/payroll-processing)
  app.setGlobalPrefix('api/v1');

  await app.listen(3000);
}
bootstrap();