import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectItemDto {
    @ApiProperty({ description: 'Reason for rejection', example: 'Incomplete documentation' })
    @IsString()
    @IsNotEmpty()
    reason: string;
}
