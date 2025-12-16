import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class CreateDisputeDto {
  @IsMongoId() 
  @IsNotEmpty()
  payslipId: string; 

  @IsString() 
  @IsNotEmpty()
  description: string;
}