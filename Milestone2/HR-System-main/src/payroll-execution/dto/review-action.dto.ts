import { IsEnum, IsString } from 'class-validator';

export enum ReviewStatus {
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    WAITING_FINANCE = 'WAITING_FINANCE',
}

export class ReviewActionDto {
    @IsEnum(ReviewStatus)
    status: ReviewStatus;

    @IsString()
    comment: string;
}
