import { config } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

// Load .env file before anything else
import * as path from 'path';
config({ path: path.resolve(process.cwd(), '.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable global validation
  app.useGlobalPipes(new ValidationPipe());

  // Enable CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN') || '*',
    credentials: true,
  });

  // Get MongoDB connection and listen for connection events
  let connectionLogged = false;
  try {
    const connection = app.get<Connection>(getConnectionToken());
    
    const logConnection = () => {
      if (!connectionLogged) {
        console.log('MongoDB is connected');
        connectionLogged = true;
      }
    };

    if (connection.readyState === 1) {
      logConnection();
    } else {
      connection.once('connected', logConnection);
    }

    setTimeout(() => {
      if (connection.readyState === 1 && !connectionLogged) {
        logConnection();
      }
    }, 2000);
  } catch (error) {
    // MongoDB connection not available
  }

  const port = configService.get<string>('PORT');
  if (!port) {
    throw new Error('PORT environment variable is required. Please set it in your .env file.');
  }
  
  await app.listen(port);
  console.log(`Nest is running on port ${port}`);
}

bootstrap();

