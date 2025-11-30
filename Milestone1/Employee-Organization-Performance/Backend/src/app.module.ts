import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Employee, EmployeeSchema } from '../Models/employeeSchema';
import {
  Department,
  DepartmentSchema,
} from '../Models/Organization Schema/departmenSchema';
import {
  Position,
  PositionSchema,
} from '../Models/Organization Schema/postionSchema';
import { User, UserSchema } from '../Models/userSchema';
import {
  AppraisalTemplate,
  AppraisalTemplateSchema,
} from '../Models/performance/AppraisalTemplate';
import {
  AppraisalCycle,
  AppraisalCycleSchema,
} from '../Models/performance/AppraisalCycle';
import {
  PerformanceAppraisal,
  PerformanceAppraisalSchema,
} from '../Models/performance/PerformanceAppraisal';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://team1:notPassword@cluster0.4mleald.mongodb.net/?appName=Cluster0',
    ),
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: Position.name, schema: PositionSchema },
      { name: User.name, schema: UserSchema },
      { name: AppraisalTemplate.name, schema: AppraisalTemplateSchema },
      { name: AppraisalCycle.name, schema: AppraisalCycleSchema },
      { name: PerformanceAppraisal.name, schema: PerformanceAppraisalSchema },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
