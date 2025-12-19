import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';

export class FinalSettlementDto {
    @IsNotEmpty()
    @IsString()
    employeeId: string;

    @IsOptional()
    @IsDateString()
    terminationDate?: string;

    @IsOptional()
    @IsString()
    reason?: string;
}
