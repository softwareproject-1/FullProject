import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OfferResponseStatus } from '../enums/offer-response-status.enum';

export class RespondToOfferDto {
  @IsEnum(OfferResponseStatus)
  response: OfferResponseStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
