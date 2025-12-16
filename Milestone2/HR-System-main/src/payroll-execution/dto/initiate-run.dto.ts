import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class InitiateRunDto {
    @IsString()
    @IsNotEmpty()
    month: string;

    @IsNumber()
    @IsNotEmpty()
    year: number;

    @IsString()
    @IsNotEmpty()
    entity: string;
}