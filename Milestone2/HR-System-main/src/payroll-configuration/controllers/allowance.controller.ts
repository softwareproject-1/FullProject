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
// import { Roles } from '../guards/roles.decorator';
// import { RolesGuard } from '../guards/roles.guard';
// import { AuthGuard } from '@nestjs/passport'; // assuming JWT auth
// @UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('allowances')
export class AllowanceController {
  constructor(private readonly service: AllowanceService) {}

  @Post()
  //@Roles('Payroll Specialist')
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
  //@Roles('Payroll Specialist')
  update(@Param('id') id: string, @Body() dto: UpdateAllowanceDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  // @Roles('Payroll Specialist')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
