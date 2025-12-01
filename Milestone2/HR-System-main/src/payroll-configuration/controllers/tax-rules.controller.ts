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
import { Roles } from '../../auth/decorators/roles.decorator'; // import from auth
import { RolesGuard } from '../../auth/guards/roles.guard'; // import from auth
import { AuthGuard } from '@nestjs/passport'; // JWT auth

@Controller('tax-rules')
@UseGuards(AuthGuard('jwt'), RolesGuard) // apply auth + roles guard to all routes

@UseGuards(AuthGuard('jwt'), RolesGuard) // apply auth + roles guard to all routes
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
  @Roles('Legal & Policy Admin') // Only Legal Admin can delete
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
