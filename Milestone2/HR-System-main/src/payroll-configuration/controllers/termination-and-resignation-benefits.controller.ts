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
import { TerminationAndResignationBenefitsService } from '../services/termination-and-resignation-benefits.service';
import { CreateTerminationBenefitsDto } from '../dtos/termination-and-resignation-benefits/create-termination-benefits.dto';
import { UpdateTerminationBenefitsDto } from '../dtos/termination-and-resignation-benefits/update-termination-benefits.dto';
import { Roles } from '../../auth/decorators/roles.decorator'; // import from auth
import { RolesGuard } from '../../auth/guards/roles.guard'; // import from auth
import { AuthGuard } from '@nestjs/passport'; // JWT auth
// @UseGuards(AuthGuard('jwt'), RolesGuard)

@Controller('termination-and-resignation-benefits')
@UseGuards(AuthGuard('jwt'), RolesGuard) // apply auth + roles guard to all routes
export class TerminationAndResignationBenefitsController {
  constructor(
    private readonly service: TerminationAndResignationBenefitsService,
  ) {}

  @Post()
   @Roles('Payroll Specialist') // Only Payroll Specialist can create

  create(@Body() dto: CreateTerminationBenefitsDto) {
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
    @Roles('Payroll Specialist') // Only Payroll Specialist can update

  update(@Param('id') id: string, @Body() dto: UpdateTerminationBenefitsDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
   @Roles('Payroll Specialist') // Only Payroll Specialist can delete

  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
