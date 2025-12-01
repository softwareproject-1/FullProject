import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
// Import all your models
import { AttendanceLog, AttendanceLogSchema } from '../milestone 1 DB/Models/AttendanceLog';
import { AttendanceCorrectionRequest, AttendanceCorrectionRequestSchema } from '../milestone 1 DB/Models/AttendanceCorrectionRequest';
import { DataBackup, DataBackupSchema } from '../milestone 1 DB/Models/DataBackup';
import { HolidayCalendar, HolidayCalendarSchema } from '../milestone 1 DB/Models/HolidayCalendar';
import { PayrollEscalation, PayrollEscalationSchema } from '../milestone 1 DB/Models/payrollEscalation';
import { Policy, PolicySchema } from '../milestone 1 DB/Models/policyschema';
import { ShiftAssignment, ShiftAssignmentSchema } from '../milestone 1 DB/Models/ShiftAssignment';
import { ShiftTemplate, ShiftTemplateSchema } from '../milestone 1 DB/Models/ShiftTemplate';
import { SyncLog, SyncLogSchema } from '../milestone 1 DB/Models/SyncLog';
import { TimeException, TimeExceptionSchema } from '../milestone 1 DB/Models/TimeException';
import { TimeReport, TimeReportSchema } from '../milestone 1 DB/Models/TimeReport';
import { VacationLink, VacationLinkSchema } from '../milestone 1 DB/Models/VacationLink';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('DB_URL', 'mongodb+srv://team2:123@cluster0.4mleald.mongodb.net/?appName=Cluster0'),
      }),
    }),
    // Register all your models here
    MongooseModule.forFeature([
      { name: AttendanceLog.name, schema: AttendanceLogSchema },
      { name: AttendanceCorrectionRequest.name, schema: AttendanceCorrectionRequestSchema },
      { name: DataBackup.name, schema: DataBackupSchema },
      { name: HolidayCalendar.name, schema: HolidayCalendarSchema },
      { name: PayrollEscalation.name, schema: PayrollEscalationSchema },
      { name: Policy.name, schema: PolicySchema },
      { name: ShiftAssignment.name, schema: ShiftAssignmentSchema },
      { name: ShiftTemplate.name, schema: ShiftTemplateSchema },
      { name: SyncLog.name, schema: SyncLogSchema },
      { name: TimeException.name, schema: TimeExceptionSchema },
      { name: TimeReport.name, schema: TimeReportSchema },
      { name: VacationLink.name, schema: VacationLinkSchema },
    ]),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

