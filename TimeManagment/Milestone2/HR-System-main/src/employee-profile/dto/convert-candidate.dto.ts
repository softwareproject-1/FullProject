import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class ConvertCandidateDto {
  @IsString()
  @IsNotEmpty()
  candidateId: string;

  @IsString()
  @IsNotEmpty()
  employeeNumber: string;

  @IsDateString()
  dateOfHire: string;

  @IsOptional()
  @IsString()
  positionId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  payGradeId?: string;
}

