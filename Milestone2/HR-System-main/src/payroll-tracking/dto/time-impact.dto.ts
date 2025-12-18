import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsBoolean, IsArray, IsEnum, IsOptional, IsISO8601 } from 'class-validator';

/**
 * Types of time-based penalties
 */
export enum PenaltyType {
    UNAPPROVED_ABSENCE = 'UNAPPROVED_ABSENCE',
    LATE = 'LATE',
    EARLY_LEAVE = 'EARLY_LEAVE',
    MISCONDUCT = 'MISCONDUCT',
}

/**
 * Status of time-related items
 */
export enum TimeItemStatus {
    FINALIZED = 'FINALIZED',
    DISPUTED = 'DISPUTED',
    PENDING_CORRECTION = 'PENDING_CORRECTION',
}

/**
 * Overtime rate categories per Egyptian Labor Law 2025
 */
export enum OvertimeRateType {
    DAYTIME = 'DAYTIME',           // 135%
    NIGHTTIME = 'NIGHTTIME',       // 170%
    WEEKLY_REST = 'WEEKLY_REST',   // 200%
    OFFICIAL_HOLIDAY = 'OFFICIAL_HOLIDAY', // 300%
}

/**
 * Individual penalty item from time management
 */
export class PenaltyItemDto {
    @ApiProperty({ description: 'Unique identifier for the penalty' })
    @IsString()
    id: string;

    @ApiProperty({ description: 'Date of the incident', example: '2024-10-12' })
    @IsISO8601()
    date: string;

    @ApiProperty({ enum: PenaltyType, description: 'Type of penalty' })
    @IsEnum(PenaltyType)
    type: PenaltyType;

    @ApiProperty({ description: 'Human-readable reason', example: 'Late arrival by 45 minutes on Oct 12' })
    @IsString()
    reason: string;

    @ApiProperty({ description: 'Amount deducted in EGP' })
    @IsNumber()
    amount: number;

    @ApiProperty({ description: 'Minutes late (for lateness penalties)', required: false })
    @IsOptional()
    @IsNumber()
    minutesLate?: number;

    @ApiProperty({ enum: TimeItemStatus, description: 'Current status of the item' })
    @IsEnum(TimeItemStatus)
    status: TimeItemStatus;

    @ApiProperty({ description: 'Reference to attendance record ID' })
    @IsString()
    attendanceRecordId: string;

    @ApiProperty({ description: 'Reference to time exception ID', required: false })
    @IsOptional()
    @IsString()
    exceptionId?: string;
}

/**
 * Individual overtime item from time management
 */
export class OvertimeItemDto {
    @ApiProperty({ description: 'Unique identifier for the overtime record' })
    @IsString()
    id: string;

    @ApiProperty({ description: 'Date of overtime work', example: '2024-10-15' })
    @IsISO8601()
    date: string;

    @ApiProperty({ description: 'Hours of overtime worked' })
    @IsNumber()
    hoursWorked: number;

    @ApiProperty({ description: 'Rate multiplier (1.35, 1.70, 2.00, or 3.00)' })
    @IsNumber()
    rate: number;

    @ApiProperty({ enum: OvertimeRateType, description: 'Category of overtime rate' })
    @IsEnum(OvertimeRateType)
    rateType: OvertimeRateType;

    @ApiProperty({ description: 'Compensation earned in EGP' })
    @IsNumber()
    compensation: number;

    @ApiProperty({ description: 'Approval status' })
    @IsString()
    status: string;
}

/**
 * Permission/personal time item
 */
export class PermissionItemDto {
    @ApiProperty({ description: 'Unique identifier' })
    @IsString()
    id: string;

    @ApiProperty({ description: 'Date of permission', example: '2024-10-20' })
    @IsISO8601()
    date: string;

    @ApiProperty({ description: 'Hours of permission taken' })
    @IsNumber()
    hours: number;

    @ApiProperty({ description: 'Whether permission is paid or unpaid' })
    @IsString()
    type: 'PAID' | 'UNPAID';

    @ApiProperty({ description: 'Reason for permission', required: false })
    @IsOptional()
    @IsString()
    reason?: string;

    @ApiProperty({ description: 'Whether the permission exceeded allowed limits' })
    @IsBoolean()
    limitExceeded: boolean;
}

/**
 * Complete time impact data for a pay period
 */
export class TimeImpactDataDto {
    @ApiProperty({ description: 'Employee ID' })
    @IsString()
    employeeId: string;

    @ApiProperty({ description: 'Month (1-12)' })
    @IsNumber()
    month: number;

    @ApiProperty({ description: 'Year' })
    @IsNumber()
    year: number;

    @ApiProperty({ type: [PenaltyItemDto], description: 'List of penalties' })
    @IsArray()
    penalties: PenaltyItemDto[];

    @ApiProperty({ description: 'Total penalty amount in EGP' })
    @IsNumber()
    totalPenalties: number;

    @ApiProperty({ type: [OvertimeItemDto], description: 'List of overtime records' })
    @IsArray()
    overtime: OvertimeItemDto[];

    @ApiProperty({ description: 'Total overtime compensation in EGP' })
    @IsNumber()
    totalOvertimeCompensation: number;

    @ApiProperty({ type: [PermissionItemDto], description: 'List of permissions' })
    @IsArray()
    permissions: PermissionItemDto[];

    @ApiProperty({ description: 'Paid permission hours' })
    @IsNumber()
    paidPermissions: number;

    @ApiProperty({ description: 'Unpaid permission hours' })
    @IsNumber()
    unpaidPermissions: number;

    @ApiProperty({ description: 'Whether minimum wage alert is triggered' })
    @IsBoolean()
    minimumWageAlert: boolean;

    @ApiProperty({ description: 'Projected net pay after time deductions' })
    @IsNumber()
    projectedNetPay: number;

    @ApiProperty({ description: 'Statutory minimum wage' })
    @IsNumber()
    minimumWage: number;

    @ApiProperty({ description: 'Whether any items are disputed' })
    @IsBoolean()
    hasDisputedItems: boolean;

    @ApiProperty({ type: [String], description: 'IDs of disputed items' })
    @IsArray()
    disputedItemIds: string[];
}
