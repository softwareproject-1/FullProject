// import { Module } from '@nestjs/common';
// import { ConfigModule } from '@nestjs/config';
// import { MongooseModule } from '@nestjs/mongoose';

// // Import custom modules
// import { AuthModule } from './auth/auth.module';
// import { IntegrationsModule } from './integrations/integrations.module';
// import { NotificationsModule } from './notifications/notifications.module';
// import { RecruitmentTrackingModule } from './recruitment-tracking/recruitment-tracking.module';
// import { SharedModule } from './shared/shared.module';

// // Import configuration
// import { appConfig } from './config/app.config';
// import { databaseConfig } from './config/database.config';
// import { jwtConfig } from './config/jwt.config';

// @Module({
//   imports: [
//     // Configuration
//     ConfigModule.forRoot({
//       isGlobal: true,
//       load: [appConfig, databaseConfig, jwtConfig],
//     }),
    
//     // Database
//     MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/recruitment'),
    
//     // Feature modules
//     AuthModule,
//     IntegrationsModule,
//     NotificationsModule,
//     RecruitmentTrackingModule,
//     SharedModule,
//   ],
//   controllers: [],
//   providers: [],
// })
// export class AppModule {}