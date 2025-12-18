import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Put,
  Delete,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AllowanceService } from '../services/allowance.service';
import { CreateAllowanceDto } from '../dtos/allowance/create-allowance.dto';
import { UpdateAllowanceDto } from '../dtos/allowance/update-allowance.dto';
import { AuthenticationGuard } from '../../auth/guards/authentication.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
@Controller('allowances')
@UseGuards(AuthenticationGuard, RolesGuard) // apply auth + roles guard to all routes
export class AllowanceController {
  constructor(private readonly service: AllowanceService) {}

  @Post()
  @Roles('Payroll Specialist')
  create(@Body() dto: CreateAllowanceDto) {
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
  @Roles('Payroll Specialist')
  update(@Param('id') id: string, @Body() dto: UpdateAllowanceDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('Payroll Manager')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch(':id/status')
  @Roles('Payroll Manager')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'approved' | 'rejected' },
  ) {
    return this.service.updateStatus(id, body.status);
  }
}
