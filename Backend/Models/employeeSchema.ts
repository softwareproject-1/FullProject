import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

// ───────────────────────────────
// 🔹 ENUMS FOR EMPLOYEE ROLES / DEPARTMENTS
// ───────────────────────────────
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
  financeStaff = 'Finance Staff',
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
  onLeave = 'On Leave',
  Resigned = 'Resigned',
  Terminated = 'Terminated',
}

// ───────────────────────────────
// 🔹 EMPLOYEE SCHEMA
// ───────────────────────────────
export type EmployeeDocument = HydratedDocument<Employee>;

@Schema({ timestamps: true })
export class Employee {
  @Prop({ required: true, minlength: 2, maxlength: 50 })
  firstName: string;

  @Prop({ required: true, minlength: 2, maxlength: 50 })
  lastName: string;

  @Prop({ required: true, unique: true, minlength: 5, maxlength: 255 })
  email: string;

  @Prop({ minlength: 10, maxlength: 15 })
  phone: string;

  @Prop()
  profilePicture?: string;

  @Prop({ required: true, unique: true })
  employeeCode: string;

  @Prop({ type: String, enum: Object.values(RoleType), required: true })
  role: RoleType;

  @Prop({ type: String, enum: Object.values(DepartmentType), required: true })
  department: DepartmentType;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null,
  })
  managerId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(EmploymentStatus),
    default: EmploymentStatus.Active,
  })
  employmentStatus: EmploymentStatus;

  @Prop()
  hireDate?: Date;

  @Prop()
  contractType?: string;

  @Prop()
  payGrade?: string;

  @Prop()
  baseSalary?: number;

  @Prop()
  bankAccount?: string;

  @Prop({ min: 1, max: 5 })
  lastPerformanceRating?: number;

  @Prop({ type: Date, default: null })
  lastAppraisalDate?: Date;

  @Prop({ required: true, unique: true, minlength: 5, maxlength: 20 })
  username: string;

  @Prop({ required: true, minlength: 8 })
  passwordHash: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 'Annual', enum: Object.values(leaveType) })
  onLeave?: string;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
