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
import { InsuranceBracketsService } from '../services/insurance-brackets.service';
import { CreateInsuranceBracketDto } from '../dtos/insurance-brackets/create-insurance-bracket.dto';
import { UpdateInsuranceBracketDto } from '../dtos/insurance-brackets/update-insurance-bracket.dto';
import { Roles } from '../../auth/decorators/roles.decorator'; // import from auth
import { RolesGuard } from '../../auth/guards/roles.guard'; // import from auth
import { AuthGuard } from '@nestjs/passport'; // JWT auth

@Controller('insurance-brackets')
@UseGuards(AuthGuard('jwt'), RolesGuard) // apply auth + roles guard to all routes
export class InsuranceBracketsController {
  constructor(private readonly service: InsuranceBracketsService) {}

  @Post()
  @Roles('Payroll Specialist', 'HR Manager') // only these roles can create

  create(@Body() dto: CreateInsuranceBracketDto) {
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
  @Roles('Payroll Specialist', 'HR Manager') // only these roles can update

  update(@Param('id') id: string, @Body() dto: UpdateInsuranceBracketDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('Payroll Specialist', 'HR Manager') // only these roles can delete

  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}









