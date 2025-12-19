import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PayrollExecutionService } from './payroll-execution.service';

@Injectable()
export class PayrollSchedulerService {
    private readonly logger = new Logger(PayrollSchedulerService.name);

    constructor(private readonly payrollService: PayrollExecutionService) { }

    // Run at midnight on the 25th of every month
    // Run at midnight on the 25th of every month
    @Cron('0 0 25 * *')
    async handleMonthlyPayrollRun(dateOverride?: Date) {
        this.logger.log('Executing automatic monthly payroll run initiation...');

        const today = dateOverride ? new Date(dateOverride) : new Date();
        const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
        const month = monthFormatter.format(today).toUpperCase(); // e.g., "DEC"
        const year = today.getFullYear();

        // Default entity - this could be dynamic in a multi-tenant system
        const entity = 'Company A (US)';

        try {
            // Use a consistent system ID for the "Payroll System" automated user
            // In a real DB, you'd likely have a dedicated user ID for system actions
            const systemUserId = '000000000000000000000000';

            const result = await this.payrollService.initiatePeriod(
                { month, year, entity },
                systemUserId
            );

            this.logger.log(`Successfully initiated automatic payroll run for ${month} ${year}: ${result.runId}`);
            return { status: 'created', message: `Successfully initiated payroll run for ${month} ${year}`, runId: result.runId };
        } catch (error) {
            // If run already exists, it will throw. We can log that as info/warn.
            if (error.message && error.message.includes('already exists')) {
                this.logger.warn(`Automatic run skipped: Payroll run for ${month} ${year} already exists.`);
                return { status: 'skipped', message: `Payroll run for ${month} ${year} already exists.` };
            } else {
                this.logger.error(`Failed to initiate automatic payroll run: ${error.message}`, error.stack);
                throw error; // Rethrow other errors so controller knows it failed
            }
        }
    }

    // Debug cron to run every minute (Uncomment for testing)
    // @Cron(CronExpression.EVERY_MINUTE)
    // async handleDebugRun() {
    //   this.logger.debug('Debug Cron Job Triggered');
    // }
}
