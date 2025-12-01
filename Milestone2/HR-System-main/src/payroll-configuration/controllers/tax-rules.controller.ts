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
// import { AuthGuard } from '@nestjs/passport';
// import { RolesGuard } from '../guards/roles.guard';
// import { Roles } from '../guards/roles.decorator';
//@UseGuards(AuthGuard('jwt'), RolesGuard)

@Controller('tax-rules')
export class TaxRulesController {
  constructor(private readonly service: TaxRulesService) {}

  @Post()
  // @Roles('LegalAdmin') // Only Legal Admin can create
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
  //@Roles('LegalAdmin') // Only Legal Admin can update
  update(@Param('id') id: string, @Body() dto: UpdateTaxRuleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  //@Roles('LegalAdmin') // Only Legal Admin can delete
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
