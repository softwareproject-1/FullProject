import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class UnfreezePayrollDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(20, { message: 'Justification must be at least 20 characters long for audit compliance' })
    justification: string;
}
