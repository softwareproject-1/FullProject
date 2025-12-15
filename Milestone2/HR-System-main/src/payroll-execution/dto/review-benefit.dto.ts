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
    amount?: number; // REQ-PY-29, REQ-PY-32: Manual edit of givenAmount (BR 25, BR 27)

    @IsString()
    @IsOptional()
    reason?: string; // Rejection reason or adjustment justification

    @IsString()
    @IsOptional()
    reviewerId?: string; // Track who authorized the review (BR 25, BR 27)
}