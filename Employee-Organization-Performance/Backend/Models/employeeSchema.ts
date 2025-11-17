import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import type { ObjectId } from 'mongoose';


export enum DepartmentType {
  HR = 'HR',
  Finance = 'Finance',
  IT = 'IT',
  Legal = 'Legal',
  Recruitment = 'Recruitment',
  Organization = 'Organization',
}

export enum RoleType {
  Manager = 'Manager',
  Admin = 'Admin',
  Officer = 'Officer',
  Specialist = 'Specialist',
  Staff = 'Staff',
  systemAdmin = 'System Admin',
  lineManager = 'Line Manager',
  Employee = 'Employee',
  Candidate = 'Candidate',
  exEmployee = 'Ex-Employee',
}

export enum leaveType {
  Annual = 'Annual',
  Sick = 'Sick',
  Maternity = 'Maternity',
  Unpaid = 'Unpaid',
}

export enum EmploymentStatus {
  Onboarding = 'Onboarding',
  Offboarding = 'Offboarding',
  Deactivated = 'Deactivated',
  Active = 'Active',
  OnLeave = 'On Leave',
  Resigned = 'Resigned',
  Terminated = 'Terminated',
}

export enum EmploymentType {
  FullTime = 'Full Time',
  PartTime = 'Part Time',
  Internship = 'Internship',
  Other = 'Other',
}


export type EmployeeDocument = HydratedDocument<Employee>;

@Schema({ timestamps: true })
export class Employee {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',   
    required: true,
  })
  userAccount: Types.ObjectId;

  @Prop({ required: true, minlength: 2, maxlength: 50 })
  firstName : string;

  @Prop({ required: true, minlength: 2, maxlength: 50 })
  lastName : string;

  @Prop({ required: true, unique: true, minlength: 5, maxlength: 10 })
  employeeId  : string;
    
  @Prop({required: true})
  hireDate: Date;

  @Prop({required: true, enum: Object.values(EmploymentType)})
  employmentType : EmploymentType;

  @Prop({required: true, enum: Object.values(EmploymentStatus)})
  employmentStatus : EmploymentStatus;
  
  @Prop({
    type: Types.ObjectId,
    ref: 'Position',   
    required: true,
  })
  position: Types.ObjectId;

    @Prop({
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    })
    manager?: mongoose.Types.ObjectId;

  @Prop({
    type: {
      bankName: { type: String },
      accountNumber: { type: String },
    },
    required: true,
  })
  bankDetails: {
    bankName: string;
    accountNumber: string;
  };

  @Prop({required: true, unique: true, minlength: 5, maxlength: 15})
  socialInsuranceNumber : string;

   @Prop()
   terminationDate?: Date;

  @Prop({ required: true, unique: true, minlength: 5, maxlength: 255 })
  email: string;

  @Prop({ required: true, minlength: 10, maxlength: 15 })
  phone: string;

  @Prop()
   address: string;

  @Prop()
  profilePictureUrl?: string;

  @Prop({ type: String, enum: Object.values(RoleType), required: true })
  role: RoleType;

  @Prop({ type: String, enum: Object.values(DepartmentType), required: true })
  department: DepartmentType;

  @Prop()
  payGrade: string;

  @Prop()
  baseSalary: number;

  @Prop({ min: 1, max: 5 })
  lastPerformanceRating?: number;

  @Prop({ type: Date, default: null })
  lastAppraisalDate?: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 'Annual', enum: Object.values(leaveType) })
  LeaveType?: string;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
