import {
  IsNotEmpty,
  IsString,
  IsDate,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  IsIn,
} from 'class-validator';

// Custom validator to check date is not in the past
@ValidatorConstraint({ name: 'IsFutureDate', async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(date: Date, args: ValidationArguments) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // ignore time
    return date >= today;
  }

  defaultMessage(args: ValidationArguments) {
    return 'payDate must be today or in the future';
  }
}

export class CreateCompanySettingsDto {
  @IsNotEmpty()
  @IsDate()
  @Validate(IsFutureDateConstraint)
  payDate: Date;

  @IsNotEmpty()
  @IsString()
  timeZone: string;
  @IsNotEmpty()
  @IsString()
  @IsIn(['EGP'], { message: 'currency must be EGP' })
  currency: string = 'EGP';
}
