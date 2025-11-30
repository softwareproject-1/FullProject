import { IsOptional, IsString } from 'class-validator';

export class ArchiveEmployeeProfileDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

