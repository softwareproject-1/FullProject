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
// import { AuthGuard } from '@nestjs/passport'; // JWT authentication
// import { RolesGuard } from '../guards/roles.guard'; // your RolesGuard
// import { Roles } from '../guards/roles.decorator'; // your Roles decorator
// @UseGuards(AuthGuard('jwt'), RolesGuard)

@Controller('company-settings')
export class CompanySettingsController {
  constructor(private readonly service: CompanySettingsService) {}

  @Post()
  // @Roles('System Admin') // only System Admin can create
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
  // @Roles('System Admin') // only System Admin can update
  update(@Param('id') id: string, @Body() dto: UpdateCompanySettingsDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  // @Roles('System Admin') // only System Admin can delete
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
