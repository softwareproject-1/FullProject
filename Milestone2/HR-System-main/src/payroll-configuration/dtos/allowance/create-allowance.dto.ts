import { IsNotEmpty, IsNumber, Min, IsString , IsOptional} from 'class-validator';

export class CreateAllowanceDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)

  amount: number;
  // @IsOptional()
  // @IsString()
  // status?: string;
}
