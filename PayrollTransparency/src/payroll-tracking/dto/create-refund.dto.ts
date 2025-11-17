import { IsNumber, IsString, IsNotEmpty, IsOptional, IsMongoId, Min } from 'class-validator';

export class CreateRefundDto {
  @IsMongoId()
  @IsNotEmpty()
  employee: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsMongoId()
  @IsOptional()
  sourceDispute?: string;

  @IsMongoId()
  @IsOptional()
  sourceClaim?: string;
}
