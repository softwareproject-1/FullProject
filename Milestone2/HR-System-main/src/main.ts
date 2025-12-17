import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
const cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // Enable cookie parser middleware (CRITICAL for cookie-based authentication)
  app.use(cookieParser());

  // 🔥 DEBUG: Log ALL incoming requests
  app.use((req, res, next) => {
    console.log(`🌐 ${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Enable CORS with explicit frontend origin
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
    .addTag('auth', 'Authentication endpoints - Login, register, and user profile')
    .addTag('time-management', 'Time Management endpoints - Shifts, attendance, time exceptions, holidays, and reports')
    .addTag('recruitment', 'Recruitment endpoints')
    .addTag('leaves', 'Leave management endpoints')
    .addTag('employee-profile', 'Employee profile management endpoints')
    .addTag('organization-structure', 'Organization structure endpoints')
    .addTag('payroll-configuration', 'Payroll configuration endpoints')
    .addTag('payroll-execution', 'Payroll execution endpoints')
    .addTag('payroll-tracking', 'Payroll tracking endpoints')
    .addTag('performance', 'Performance management endpoints')
    .addServer('http://localhost:3001', 'Development server')
    .addServer('http://localhost:3000', 'Production server')
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
  SwaggerModule.setup('api-docs', app, document, {
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

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;

  try {
    await app.listen(port);
    console.log(` Nest backend is running on http://localhost:${port}`);
    console.log(` Swagger documentation available at http://localhost:${port}/api-docs`);
  } catch (error: any) {
    if (error.code === 'EADDRINUSE') {
      console.error(`\n❌ Error: Port ${port} is already in use.`);
      console.error(`\nTo fix this, you can:`);
      console.error(`  1. Kill the process using port ${port}:`);
      console.error(`     Windows: netstat -ano | findstr :${port}  (find PID)`);
      console.error(`             taskkill /PID <PID> /F  (kill process)`);
      console.error(`  2. Use a different port by setting the PORT environment variable:`);
      console.error(`     set PORT=3002 && npm start`);
      console.error(`  3. Or modify the default port in src/main.ts\n`);
      process.exit(1);
    } else {
      throw error;
    }
  }

  // Check again after a short delay in case connection completes after app starts
  setTimeout(() => {
    if (connection.readyState === 1 && !connectionLogged) {
      logConnection();
    }
  }, 2000);
}

bootstrap();