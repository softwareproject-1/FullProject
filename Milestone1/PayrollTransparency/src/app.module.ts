import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PayrollTrackingModule } from './payroll-tracking/payroll-tracking.module';

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Configure MongoDB connection
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/team7-payroll-ess',
        retryWrites: true,
        w: 'majority',
      }),
    }),
    
    // Payroll Tracking Module (contains all payroll-related features)
    PayrollTrackingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
