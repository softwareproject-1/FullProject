import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ExpenseClaimService } from '../services/expense-claim.service';
import { CreateExpenseClaimDto } from '../dto/create-expense-claim.dto';
import { UpdateExpenseClaimDto } from '../dto/update-expense-claim.dto';
import { ExpenseClaim, ClaimStatus } from '../schemas/expense-claim.schema';

@Controller('api/v1/expense-claims')
export class ExpenseClaimController {
  constructor(private readonly expenseClaimService: ExpenseClaimService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createExpenseClaimDto: CreateExpenseClaimDto): Promise<ExpenseClaim> {
    return this.expenseClaimService.create(createExpenseClaimDto);
  }

  @Get()
  async findAll(): Promise<ExpenseClaim[]> {
    return this.expenseClaimService.findAll();
  }

  @Get('employee/:employeeId')
  async findByEmployee(@Param('employeeId') employeeId: string): Promise<ExpenseClaim[]> {
    return this.expenseClaimService.findByEmployee(employeeId);
  }

  @Get('status/:status')
  async findByStatus(@Param('status') status: ClaimStatus): Promise<ExpenseClaim[]> {
    return this.expenseClaimService.findByStatus(status);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ExpenseClaim> {
    return this.expenseClaimService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateExpenseClaimDto: UpdateExpenseClaimDto,
  ): Promise<ExpenseClaim> {
    return this.expenseClaimService.update(id, updateExpenseClaimDto);
  }

  @Patch(':id/link-refund/:refundId')
  async linkRefund(
    @Param('id') id: string,
    @Param('refundId') refundId: string,
  ): Promise<ExpenseClaim> {
    return this.expenseClaimService.linkRefund(id, refundId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.expenseClaimService.remove(id);
  }
}
