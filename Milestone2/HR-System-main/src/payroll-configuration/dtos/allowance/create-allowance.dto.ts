import { IsNotEmpty, IsNumber, Min, IsString } from 'class-validator';

export class CreateAllowanceDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;
  
}
