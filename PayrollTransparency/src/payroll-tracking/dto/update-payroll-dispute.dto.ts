import { IsString, IsOptional, IsEnum, IsMongoId } from 'class-validator';
import { DisputeStatus } from '../schemas/payroll-dispute.schema';

export class UpdatePayrollDisputeDto {
  @IsEnum(DisputeStatus)
  @IsOptional()
  status?: DisputeStatus;

  @IsString()
  @IsOptional()
  employeeComments?: string;

  @IsMongoId()
  @IsOptional()
  reviewedBySpecialist?: string;

  @IsString()
  @IsOptional()
  specialistComments?: string;

  @IsMongoId()
  @IsOptional()
  reviewedByManager?: string;

  @IsString()
  @IsOptional()
  managerComments?: string;

  @IsMongoId()
  @IsOptional()
  refund?: string;
}
