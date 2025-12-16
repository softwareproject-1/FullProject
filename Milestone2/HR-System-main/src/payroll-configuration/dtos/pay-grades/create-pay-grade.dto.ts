import { IsNotEmpty, IsNumber, Min, IsString } from 'class-validator';

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
}
