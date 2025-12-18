import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AllowanceLineItemDto {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsNumber()
    amount: number;
}

export class TaxBracketInfoDto {
    @ApiProperty()
    @IsNumber()
    minIncome: number;

    @ApiProperty()
    @IsNumber()
    maxIncome: number;

    @ApiProperty()
    @IsNumber()
    rate: number;
}

export class TaxLineItemDto {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsNumber()
    amount: number;

    @ApiProperty()
    @IsString()
    lawReference: string; // E.g., "Egyptian Income Tax 2025 - Bracket 10% (0-15000 EGP)"

    @ApiProperty({ type: TaxBracketInfoDto, required: false })
    @IsOptional()
    @ValidateNested()
    @Type(() => TaxBracketInfoDto)
    bracket?: TaxBracketInfoDto;
}

export class InsuranceLineItemDto {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsNumber()
    employeeContribution: number;

    @ApiProperty()
    @IsNumber()
    employerContribution: number;

    @ApiProperty()
    @IsNumber()
    totalContribution: number;
}

export class LeaveDeductionDto {
    @ApiProperty()
    @IsNumber()
    unpaidDays: number;

    @ApiProperty()
    @IsNumber()
    deductionAmount: number;

    @ApiProperty()
    @IsString()
    calculationFormula: string; // E.g., "(3000 / 30) * 5 days = 500 EGP"
}

export class EnhancedPayslipDataDto {
    // Payslip Identification
    @ApiProperty()
    @IsString()
    payslipId: string;

    @ApiProperty()
    @IsString()
    month: string;

    @ApiProperty()
    @IsNumber()
    year: number;

    @ApiProperty()
    @IsString()
    employeeName: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    payGrade?: string;

    // === Itemized Earnings ===
    @ApiProperty()
    @IsNumber()
    baseSalary: number;

    @ApiProperty({ type: [AllowanceLineItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AllowanceLineItemDto)
    allowances: AllowanceLineItemDto[];

    @ApiProperty()
    @IsNumber()
    totalAllowances: number;

    @ApiProperty()
    @IsNumber()
    overtimeCompensation: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    leaveEncashment?: number;

    @ApiProperty()
    @IsNumber()
    grossPay: number;

    // === Itemized Deductions ===
    @ApiProperty({ type: [TaxLineItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TaxLineItemDto)
    taxDeductions: TaxLineItemDto[];

    @ApiProperty()
    @IsNumber()
    totalTax: number;

    @ApiProperty({ type: [InsuranceLineItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InsuranceLineItemDto)
    insuranceDeductions: InsuranceLineItemDto[];

    @ApiProperty()
    @IsNumber()
    totalInsurance: number;

    @ApiProperty({ type: LeaveDeductionDto, required: false })
    @IsOptional()
    @ValidateNested()
    @Type(() => LeaveDeductionDto)
    leaveDeductions?: LeaveDeductionDto;

    @ApiProperty()
    @IsNumber()
    timeBasedPenalties: number;

    @ApiProperty()
    @IsNumber()
    totalDeductions: number;

    // === Net Pay ===
    @ApiProperty()
    @IsNumber()
    netPay: number;

    // === Compliance & Transparency ===
    @ApiProperty()
    @IsNumber()
    minimumWage: number;

    @ApiProperty()
    @IsBoolean()
    minimumWageAlert: boolean;

    // === Employer Contributions (Total Rewards) ===
    @ApiProperty({ type: [InsuranceLineItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InsuranceLineItemDto)
    employerContributions: InsuranceLineItemDto[];

    @ApiProperty()
    @IsNumber()
    totalEmployerContributions: number;

    // === Dispute Support ===
    @ApiProperty({ type: [String] })
    @IsArray()
    @IsString({ each: true })
    disputeEligibleItems: string[]; // IDs of line items that can be disputed
}
