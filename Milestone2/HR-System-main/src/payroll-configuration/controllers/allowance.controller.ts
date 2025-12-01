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
import { Roles } from '../../auth/decorators/roles.decorator'; // import from auth
import { RolesGuard } from '../../auth/guards/roles.guard'; // import from auth
import { AuthGuard } from '@nestjs/passport'; // JWT auth
@Controller('allowances')
@UseGuards(AuthGuard('jwt'), RolesGuard) // apply auth + roles guard to all routes

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
   @Roles('Payroll Specialist')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
