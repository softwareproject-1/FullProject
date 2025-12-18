import { IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class YearEndProcessingDto {
    @IsNotEmpty()
    @IsNumber()
    @Min(2000)
    @Max(2100)
    year: number;
}
