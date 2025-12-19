import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptDelegationDto {
  @ApiProperty({ description: 'Manager ID who created the delegation', example: '507f1f77bcf86cd799439011' })
  @IsString()
  managerId: string;

  @ApiProperty({ description: 'Delegate ID who is accepting the delegation', example: '507f1f77bcf86cd799439012' })
  @IsString()
  delegateId: string;
}

