import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum Role {
  Manager = 'Manager',
  Admin = 'Admin',
  Employee = 'Employee',
  HR = 'HR',
  Payroll = 'Payroll'
}

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({ required: true, select: false })
  password: string;
  
  @Prop({
    required: true,
    enum: Role,
    default: Role.Employee,
  })
  role: Role;
  
  @Prop({
    type: Types.ObjectId,
    ref: 'Employee',  
    required: true,
  })
  employeeProfile: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);
