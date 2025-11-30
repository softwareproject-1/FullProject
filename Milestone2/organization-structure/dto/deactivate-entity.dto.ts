import { IsDateString, IsMongoId, IsOptional, IsString } from 'class-validator';

export class DeactivateEntityDto {
  @IsMongoId()
  @IsOptional()
  performedByEmployeeId?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

