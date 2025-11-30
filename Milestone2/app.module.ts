import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmployeeProfileModule } from './employee-profile/employee-profile.module';
import { AuthModule } from './auth/auth.module';
//import { AuthorizationModule } from './authorization/authorization.module';
import { OrganizationStructureModule } from './organization-structure/organization-structure.module';
import { PerformanceModule } from './performance/performance.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // MongoDB connection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        // Force Atlas connection - override any .env file settings
        const mongoUri = 'mongodb+srv://team1:notPassword@cluster0.4mleald.mongodb.net/FullProject?appName=Cluster0';
        console.log('Connecting to MongoDB Atlas...');
        return {
          uri: mongoUri,
          retryWrites: true,
          w: 'majority',
        };
      },
      inject: [ConfigService],
    }),
    // Feature modules
    EmployeeProfileModule,
    AuthModule,
    // AuthorizationModule, // Commented out as per user preference
    OrganizationStructureModule,
    PerformanceModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

