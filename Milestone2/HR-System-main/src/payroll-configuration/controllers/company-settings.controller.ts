import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CompanySettingsService } from '../services/company-settings.service';
import { CreateCompanySettingsDto } from '../dtos/company-settings/create-company-settings.dto';
import { UpdateCompanySettingsDto } from '../dtos/company-settings/update-company-settings.dto';
import { AuthenticationGuard } from '../../auth/guards/authentication.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('company-settings')
@UseGuards(AuthenticationGuard, RolesGuard) // apply auth + roles guard to all routes
export class CompanySettingsController {
  constructor(private readonly service: CompanySettingsService) {}

  @Post()
  @Roles('System Admin') // only System Admin can create
  create(@Body() dto: CreateCompanySettingsDto) {
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
  @Roles('System Admin') // only System Admin can update
  update(@Param('id') id: string, @Body() dto: UpdateCompanySettingsDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('Payroll Manager') // only System Admin can delete
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
