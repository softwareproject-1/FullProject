import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; // <-- IMPORT
import { MongooseModule } from '@nestjs/mongoose'; // <-- IMPORT
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PayrollProcessingModule } from './payroll-processing/payroll-processing.module';

@Module({
  imports: [
    // Configuration (load .env)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Mongoose: use PAYROLL_DB_URL from env (falls back to PAYROLL_DB_URI for compatibility)
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri:
          configService.get<string>('PAYROLL_DB_URL') ||
          configService.get<string>('PAYROLL_DB_URI') ||
          process.env.PAYROLL_DB_URL ||
          process.env.PAYROLL_DB_URI,
      }),
      inject: [ConfigService],
    }),

    PayrollProcessingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }