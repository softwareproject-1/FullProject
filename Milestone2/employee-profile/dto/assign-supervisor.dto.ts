import { IsDateString, IsOptional, IsString } from 'class-validator';

export class AssignSupervisorDto {
  @IsOptional()
  @IsString()
  employeeProfileId?: string; // Optional because it comes from URL parameter, not request body

  @IsString()
  supervisorPositionId: string;

  @IsOptional()
  @IsDateString()
  effectiveDate?: string;
}

