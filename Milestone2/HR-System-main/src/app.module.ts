import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule'; // Import ScheduleModule
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TimeManagementModule } from './time-management/time-management.module';
import { RecruitmentModule } from './recruitment/recruitment.module';
import { LeavesModule } from './leaves/leaves.module';
import { PayrollTrackingModule } from './payroll-tracking/payroll-tracking.module';
import { EmployeeProfileModule } from './employee-profile/employee-profile.module';
import { OrganizationStructureModule } from './organization-structure/organization-structure.module';
import { PerformanceModule } from './performance/performance.module';
import { PayrollConfigurationModule } from './payroll-configuration/payroll-configuration.module';
import { PayrollExecutionModule } from './payroll-execution/payroll-execution.module';
import { AuthModule } from './auth/auth.module';

import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'dist/uploads'),
      serveRoot: '/uploads',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('DB_URL', 'mongodb+srv://team2:123@cluster0.4mleald.mongodb.net/FullProject?appName=cluster0'),
      }),
    }),
    ScheduleModule.forRoot(), // Enable Task Scheduling
    AuthModule,
    TimeManagementModule,
    RecruitmentModule,
    LeavesModule,
    PayrollTrackingModule,
    EmployeeProfileModule,
    OrganizationStructureModule,
    PerformanceModule,
    PayrollConfigurationModule,
    PayrollExecutionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
