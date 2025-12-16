import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PublishAppraisalRecordDto {
  @IsString()
  @IsNotEmpty()
  hrPublisherEmployeeId: string;

  @IsOptional()
  @IsString()
  summaryComment?: string;
}


