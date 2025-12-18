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
import { TaxRulesService } from '../services/tax-rules.service';
import { CreateTaxRuleDto } from '../dtos/tax-rules/create-tax-rule.dto';
import { UpdateTaxRuleDto } from '../dtos/tax-rules/update-tax-rule.dto';
import { AuthenticationGuard } from '../../auth/guards/authentication.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ConfigStatus } from '../enums/payroll-configuration-enums';
@Controller('tax-rules')
@UseGuards(AuthenticationGuard, RolesGuard)
export class TaxRulesController {
  constructor(private readonly service: TaxRulesService) {}

  @Post()
  @Roles('Legal & Policy Admin') // Only Legal Admin can create
  create(@Body() dto: CreateTaxRuleDto) {
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
  @Roles('Legal & Policy Admin') // Only Legal Admin can update
  update(@Param('id') id: string, @Body() dto: UpdateTaxRuleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('Payroll Manager') // Only Legal Admin can delete
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
