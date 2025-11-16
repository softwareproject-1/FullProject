import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Get MongoDB connection and listen for connection events
  const connection = app.get<Connection>(getConnectionToken());
  
  let connectionLogged = false;
  
  const logConnection = () => {
    if (!connectionLogged) {
      console.log(' MongoDB connected successfully!');
      connectionLogged = true;
    }
  };
  
  // Check if already connected
  if (connection.readyState === 1) {
    logConnection();
  } else {
    // Listen for connection event
    connection.once('connected', () => {
      logConnection();
    });
  }
  
  connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });
  
  connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
  });
  
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  console.log(` Nest backend is running on http://localhost:${port}`);
  
  // Check again after a short delay in case connection completes after app starts
  setTimeout(() => {
    if (connection.readyState === 1 && !connectionLogged) {
      logConnection();
    }
  }, 2000);
}

bootstrap();

