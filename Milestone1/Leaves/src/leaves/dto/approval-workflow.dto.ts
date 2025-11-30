import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray } from 'class-validator';

export class CreateApprovalWorkflowDto {
  @IsString()
  @IsNotEmpty()
  workflowId: string;

  @IsString()
  @IsNotEmpty()
  positionCode: string;

  @IsArray()
  @IsNotEmpty()
  steps: Array<{
    stepNumber: number;
    role: string;
    slaHours?: number;
    canDelegate?: boolean;
    canOverride?: boolean;
  }>;

  @IsNumber()
  @IsOptional()
  autoEscalateHours?: number;
}

export default CreateApprovalWorkflowDto;
