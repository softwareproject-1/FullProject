import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

// Enum to specify what kind of event we are looking for (optional filter)
export enum HrEventType {
    NEW_HIRE = 'NEW_HIRE',
    TERMINATION = 'TERMINATION',
    RESIGNATION = 'RESIGNATION'
}

export class HrEventCheckDto {
    @IsString()
    @IsNotEmpty()
    employeeId: string;

    @IsEnum(HrEventType)
    @IsOptional()
    eventType?: HrEventType;
}