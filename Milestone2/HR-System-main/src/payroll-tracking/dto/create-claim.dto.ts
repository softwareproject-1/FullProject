import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateClaimDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  claimType: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  amount: number;
}
