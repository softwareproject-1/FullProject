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
import { TerminationAndResignationBenefitsService } from '../services/termination-and-resignation-benefits.service';
import { CreateTerminationBenefitsDto } from '../dtos/termination-and-resignation-benefits/create-termination-benefits.dto';
import { UpdateTerminationBenefitsDto } from '../dtos/termination-and-resignation-benefits/update-termination-benefits.dto';
import { AuthenticationGuard } from '../../auth/guards/authentication.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ConfigStatus } from '../enums/payroll-configuration-enums';
// @UseGuards(AuthGuard('jwt'), RolesGuard)

@Controller('termination-and-resignation-benefits')
@UseGuards(AuthenticationGuard, RolesGuard) // apply auth + roles guard to all routes
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
  @Roles('Payroll Manager') // Only Payroll Manager can delete
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
