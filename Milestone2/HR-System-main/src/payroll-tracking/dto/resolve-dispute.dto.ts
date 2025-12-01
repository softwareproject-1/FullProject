import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
// FIX: Import the enum from the dedicated enums file
import { DisputeStatus } from '../enums/payroll-tracking-enum'; 

export class ResolveDisputeDto {
  @IsEnum(DisputeStatus) 
  @IsNotEmpty()
  status: DisputeStatus; 

  @IsString() 
  @IsNotEmpty()
  resolutionComment: string;
}