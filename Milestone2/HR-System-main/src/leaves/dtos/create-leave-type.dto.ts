import { Type } from 'class-transformer';
import { IsString, IsBoolean, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApprovalStepDto {
  @ApiProperty({ description: 'Role name for this approval step', example: 'Manager' })
  @IsString()
  role: string; // e.g., 'Manager', 'HR', 'Director'

  @ApiProperty({ description: 'Step level/order in the approval chain', example: 1 })
  @IsNumber()
  level: number; // the step order in the chain
}

export class CreateLeaveTypeDto {
  @ApiProperty({ description: 'Leave type code', example: 'LT001' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Leave type name', example: 'Annual Leave' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Category ID', example: '507f1f77bcf86cd799439011' })
  @IsString()
  categoryId: string;

  @ApiPropertyOptional({ description: 'Description of the leave type', example: 'Annual vacation leave' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Whether this leave type is paid', example: true })
  @IsBoolean()
  paid: boolean;

  @ApiProperty({ description: 'Whether this leave is deductible from balance', example: true })
  @IsBoolean()
  deductible: boolean;

  @ApiProperty({ description: 'Whether attachment is required', example: false })
  @IsBoolean()
  requiresAttachment: boolean;

  @ApiPropertyOptional({ description: 'Type of attachment required', example: 'Medical Certificate' })
  @IsOptional()
  @IsString()
  attachmentType?: string;

  @ApiPropertyOptional({ description: 'Minimum tenure in months required', example: 6 })
  @IsOptional()
  @IsNumber()
  minTenureMonths?: number;

  @ApiPropertyOptional({ description: 'Maximum duration in days', example: 30 })
  @IsOptional()
  @IsNumber()
  maxDurationDays?: number;

  @ApiProperty({ description: 'Payroll integration code', example: 'PR_ANNUAL' })
  @IsString()
  payrollCode: string;

  @ApiPropertyOptional({ description: 'Approval workflow steps', type: [ApprovalStepDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ApprovalStepDto)
  approvalWorkflow?: ApprovalStepDto[];
}


