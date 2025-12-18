import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PayrollPoliciesService } from '../services/payroll-policies.service';
import { CreatePayrollPolicyDto } from '../dtos/payroll-policies/create-payroll-policy.dto';
import { UpdatePayrollPolicyDto } from '../dtos/payroll-policies/update-payroll-policy.dto';
import { AuthenticationGuard } from '../../auth/guards/authentication.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ConfigStatus } from '../enums/payroll-configuration-enums';
// @UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('payroll-policies')
@UseGuards(AuthenticationGuard, RolesGuard) // apply auth + roles guard to all routes
export class PayrollPoliciesController {
  constructor(private readonly service: PayrollPoliciesService) {}

  @Post()
  @Roles('Payroll Specialist') // Only Admin can create
  create(@Body() dto: CreatePayrollPolicyDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles('Payroll Specialist') // Only Admin can update
  update(@Param('id') id: string, @Body() dto: UpdatePayrollPolicyDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('Payroll Manager') // Only Admin can delete
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
  @Patch(':id/status')
  @Roles('Payroll Manager')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: ConfigStatus.APPROVED | ConfigStatus.REJECTED },
  ) {
    return this.service.updateStatus(id, body.status);
  }
}
