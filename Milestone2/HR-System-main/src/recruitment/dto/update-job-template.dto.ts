import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateJobTemplateDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  qualifications?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsString()
  @IsOptional()
  description?: string;
}
