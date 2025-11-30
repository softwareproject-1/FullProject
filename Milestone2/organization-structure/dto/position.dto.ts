import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePositionDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  @IsNotEmpty()
  departmentId: string;

  @IsMongoId()
  @IsOptional()
  reportsToPositionId?: string;

  @IsMongoId()
  @IsOptional()
  performedByEmployeeId?: string;
}

export class UpdatePositionDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  @IsOptional()
  departmentId?: string;

  @IsMongoId()
  @IsOptional()
  reportsToPositionId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsMongoId()
  @IsOptional()
  performedByEmployeeId?: string;
}

