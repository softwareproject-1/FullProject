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
import { InsuranceBracketsService } from '../services/insurance-brackets.service';
import { CreateInsuranceBracketDto } from '../dtos/insurance-brackets/create-insurance-bracket.dto';
import { UpdateInsuranceBracketDto } from '../dtos/insurance-brackets/update-insurance-bracket.dto';
import { AuthenticationGuard } from '../../auth/guards/authentication.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

@Controller('insurance-brackets')
@UseGuards(AuthenticationGuard, RolesGuard) // apply auth + roles guard to all routes
export class InsuranceBracketsController {
  constructor(private readonly service: InsuranceBracketsService) {}

  @Post()
  @Roles('Payroll Specialist') // only these roles can create
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
  @Roles('HR Manager') // only these roles can delete
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch(':id/status')
  @Roles('HR Manager')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: ConfigStatus.APPROVED | ConfigStatus.REJECTED },
  ) {
    return this.service.updateStatus(id, body.status);
  }
}
