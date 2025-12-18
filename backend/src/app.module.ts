import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Subsystem Modules
import { RecruitmentModule } from './recruitment/recruitment.module';
import { EmployeeProfileModule } from './employee-profile/employee-profile.module';
import { OrganizationStructureModule } from './organization-structure/organization-structure.module';
import { TimeManagementModule } from './time-management/time-management.module';
import { LeavesModule } from './leaves/leaves.module';
import { PerformanceModule } from './performance/performance.module';
import { PayrollConfigurationModule } from './payroll-configuration/payroll-configuration.module';
import { PayrollExecutionModule } from './payroll-execution/payroll-execution.module';
import { PayrollTrackingModule } from './payroll-tracking/payroll-tracking.module';

// Authentication Module
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // 1. Configuration Module: Loads .env variables
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available throughout the app
      envFilePath: '.env', // Explicitly look for .env file
    }),

    // 2. Database Connection: Connects to MongoDB using the URI from .env
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),

    // 3. Feature Modules (The Subsystems)
    RecruitmentModule,
    EmployeeProfileModule,
    OrganizationStructureModule,
    TimeManagementModule,
    LeavesModule,
    PerformanceModule,
    PayrollConfigurationModule,
    PayrollExecutionModule,
    PayrollTrackingModule,
    
    // 4. Authentication Module (JWT-based auth with guards)
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}