import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { AdjustmentType } from '../enums/adjustment-type.enum';

export class ManualAdjustmentDto {
    @IsNotEmpty()
    @IsString()
    employeeId: string;

    @IsNotEmpty()
    @IsString()
    leaveTypeId: string;

    @IsNotEmpty()
    @IsEnum(AdjustmentType)
    adjustmentType: AdjustmentType;

    @IsNotEmpty()
    @IsNumber()
    @Min(0.01)
    amount: number;

    @IsNotEmpty()
    @IsString()
    reason: string;

    @IsNotEmpty()
    @IsString()
    hrUserId: string;
}
