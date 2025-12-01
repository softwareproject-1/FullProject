import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for Swagger UI
  app.enableCors({
    origin: true,
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  
  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('HR System API')
    .setDescription('Comprehensive API documentation for HR System. This API provides endpoints for managing employee profiles, time management, leaves, recruitment, payroll, performance, and organizational structure.')
    .setVersion('1.0.0')
    .addTag('time-management', 'Time Management endpoints - Shifts, attendance, time exceptions, holidays, and reports')
    .addTag('recruitment', 'Recruitment endpoints')
    .addTag('leaves', 'Leave management endpoints')
    .addTag('employee-profile', 'Employee profile management endpoints')
    .addTag('organization-structure', 'Organization structure endpoints')
    .addTag('payroll-configuration', 'Payroll configuration endpoints')
    .addTag('payroll-execution', 'Payroll execution endpoints')
    .addTag('payroll-tracking', 'Payroll tracking endpoints')
    .addTag('performance', 'Performance management endpoints')
    .addServer('http://localhost:3000', 'Development server')
    .addServer('http://localhost:3001', 'Production server')
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
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'HR System API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
  });
  
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
  console.log(` Swagger documentation available at http://localhost:${port}/api`);
  
  // Check again after a short delay in case connection completes after app starts
  setTimeout(() => {
    if (connection.readyState === 1 && !connectionLogged) {
      logConnection();
    }
  }, 2000);
}

bootstrap();