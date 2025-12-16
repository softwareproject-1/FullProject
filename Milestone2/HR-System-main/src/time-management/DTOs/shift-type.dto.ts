import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShiftTypeDto {
  @ApiProperty({ description: 'Shift type name', example: 'Morning Shift' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Whether the shift type is active', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class UpdateShiftTypeDto {
  @ApiPropertyOptional({ description: 'Shift type name', example: 'Morning Shift' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Whether the shift type is active' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

