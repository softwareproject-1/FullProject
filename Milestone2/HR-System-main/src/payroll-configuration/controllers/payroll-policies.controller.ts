

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards
} from '@nestjs/common';
import { PayrollPoliciesService } from '../services/payroll-policies.service';
import { CreatePayrollPolicyDto } from '../dtos/payroll-policies/create-payroll-policy.dto';
import { UpdatePayrollPolicyDto } from '../dtos/payroll-policies/update-payroll-policy.dto';
// import { AuthGuard } from '@nestjs/passport';
// import { RolesGuard } from '../guards/roles.guard';
// import { Roles } from '../guards/roles.decorator';
// @UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('payroll-policies')
export class PayrollPoliciesController {
  constructor(private readonly service: PayrollPoliciesService) {}

  @Post()
  //  @Roles('Payroll Specialist') // Only Admin can create

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
    //@Roles('Payroll Specialist') // Only Admin can update

  update(@Param('id') id: string, @Body() dto: UpdatePayrollPolicyDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
   // @Roles('Payroll Specialist') // Only Admin can delete

  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
