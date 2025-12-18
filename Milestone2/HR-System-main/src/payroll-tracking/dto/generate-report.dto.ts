import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateReportDto {
    @ApiProperty({ description: 'Start date for the report period (ISO 8601)', example: '2025-01-01T00:00:00.000Z' })
    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @ApiProperty({ description: 'End date for the report period (ISO 8601)', example: '2025-12-31T23:59:59.999Z' })
    @IsDateString()
    @IsNotEmpty()
    endDate: string;

    @ApiProperty({ description: 'Department ID (optional)', required: false })
    @IsString()
    @IsOptional()
    departmentId?: string;
}
