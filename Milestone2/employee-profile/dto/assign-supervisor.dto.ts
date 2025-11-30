import { IsDateString, IsOptional, IsString } from 'class-validator';

export class AssignSupervisorDto {
  @IsString()
  employeeProfileId: string;

  @IsString()
  supervisorPositionId: string;

  @IsOptional()
  @IsDateString()
  effectiveDate?: string;
}

