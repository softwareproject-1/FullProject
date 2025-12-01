import { IsString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export enum PeriodAction {
    APPROVE = 'APPROVE',
    REJECT = 'REJECT'
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

