import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RevokeDelegationDto {
  @ApiProperty({ description: 'Manager ID who wants to revoke delegation', example: '507f1f77bcf86cd799439011' })
  @IsString()
  managerId: string;
}

