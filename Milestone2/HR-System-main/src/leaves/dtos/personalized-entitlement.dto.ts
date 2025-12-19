import { IsString, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class GroupCriteriaDto {
    @ApiPropertyOptional({ description: 'Array of department IDs', example: ['dept1', 'dept2'] })
    @IsOptional()
    @IsString({ each: true })
    departmentIds?: string[];

    @ApiPropertyOptional({ description: 'Array of position IDs', example: ['pos1', 'pos2'] })
    @IsOptional()
    @IsString({ each: true })
    positionIds?: string[];

    @ApiPropertyOptional({ description: 'Array of locations', example: ['Egypt', 'USA'] })
    @IsOptional()
    @IsString({ each: true })
    locations?: string[]; // e.g., ['Egypt', 'USA']

    @ApiPropertyOptional({ description: 'Array of contract types', example: ['PERMANENT', 'CONTRACT'] })
    @IsOptional()
    @IsString({ each: true })
    contractTypes?: string[]; // e.g., ['PERMANENT', 'CONTRACT']

    @ApiPropertyOptional({ description: 'Explicit list of employee IDs', example: ['emp1', 'emp2'] })
    @IsOptional()
    @IsString({ each: true })
    employeeIds?: string[]; // Explicit list of employee IDs
}

export class PersonalizedEntitlementDto {
    @ApiProperty({ description: 'Leave type ID', example: '507f1f77bcf86cd799439012' })
    @IsString()
    leaveTypeId: string;

    @ApiProperty({ description: 'Yearly entitlement in days', example: 25 })
    @IsNumber()
    yearlyEntitlement: number;

    @ApiPropertyOptional({ description: 'Reason for custom entitlement', example: 'Special agreement with employee' })
    @IsOptional()
    @IsString()
    reason?: string; // Why this custom entitlement was assigned

    // For individual assignment
    @ApiPropertyOptional({ description: 'Employee ID for individual assignment', example: '507f1f77bcf86cd799439011' })
    @IsOptional()
    @IsString()
    employeeId?: string;

    // For group assignment (at least one must be provided if employeeId is not)
    @ApiPropertyOptional({ description: 'Group criteria for bulk assignment', type: GroupCriteriaDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => GroupCriteriaDto)
    groupCriteria?: GroupCriteriaDto;
}
