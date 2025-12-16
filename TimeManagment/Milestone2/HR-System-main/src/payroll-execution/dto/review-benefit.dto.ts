import { IsString, IsEnum, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export enum BenefitType {
    SIGNING_BONUS = 'SIGNING_BONUS',
    TERMINATION = 'TERMINATION'
}

export enum BenefitAction {
    APPROVE = 'APPROVED',
    REJECT = 'REJECTED'
}

export class ReviewBenefitDto {
    @IsString()
    @IsNotEmpty()
    employeeId: string;

    @IsEnum(BenefitType)
    @IsNotEmpty()
    type: BenefitType;

    @IsEnum(BenefitAction)
    @IsNotEmpty()
    action: BenefitAction;

    @IsNumber()
    @IsOptional()
    amount?: number;
}