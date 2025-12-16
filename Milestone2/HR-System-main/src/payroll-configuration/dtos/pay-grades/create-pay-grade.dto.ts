import {
  IsNotEmpty,
  IsNumber,
  Min,
  IsString,
  IsOptional,
  IsArray,
  IsMongoId,
} from 'class-validator';

export class CreatePayGradeDto {
  @IsNotEmpty()
  @IsString()
  grade: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(6000)
  baseSalary: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(6000)
  grossSalary: number;
  // allowances removed: gross salary will be validated against allowance service
  // @IsOptional()
  //   @IsString()
  //   status?: string;
}
