import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AcknowledgeAppraisalRecordDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsOptional()
  @IsString()
  acknowledgementComment?: string;
}


