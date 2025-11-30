import { IsNotEmpty, IsString, Matches } from 'class-validator';

/**
 * DTO (Data Transfer Object) for initiating a new payroll run.
 * It validates that the incoming data has a 'period' field
 * formatted as "Mmm-YYYY" (e.g., "Nov-2025").
 */
export class InitiatePayrollDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z][a-z]{2}-\d{4}$/, {
    message: 'Period must be in "Mmm-YYYY" format (e.g., Nov-2025)',
  })
  period: string;
}
