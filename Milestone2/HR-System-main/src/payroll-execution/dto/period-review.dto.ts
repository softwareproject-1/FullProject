import { IsString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export enum PeriodAction {
    APPROVE = 'APPROVE',
    APPROVED = 'APPROVED',
    REJECT = 'REJECT',
    REJECTED = 'REJECTED'
}

export class PeriodReviewDto {
    @IsString()
    @IsNotEmpty()
    runId: string;

    @IsEnum(PeriodAction)
    @IsNotEmpty()
    action: PeriodAction;

    @IsString()
    @IsOptional()
    rejectionReason?: string;
}

