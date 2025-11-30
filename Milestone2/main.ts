import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend integration
  app.enableCors({
    origin: true,
    credentials: true,
  });

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

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 5000;
  
  try {
    await app.listen(port);
    console.log(`🚀 Application is running on: http://localhost:${port}/api`);
    console.log(`📊 MongoDB connected successfully`);
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use.`);
      console.error(`💡 Solution: Stop the other instance or use a different port.`);
      console.error(`   To use a different port, set PORT environment variable: PORT=3001 npm run start:dev`);
      process.exit(1);
    } else {
      throw error;
    }
  }
}

bootstrap();

