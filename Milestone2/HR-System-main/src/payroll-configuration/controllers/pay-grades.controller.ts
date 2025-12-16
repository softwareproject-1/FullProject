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
import { PayGradesService } from '../services/pay-grades.service';
import { CreatePayGradeDto } from '../dtos/pay-grades/create-pay-grade.dto';
import { UpdatePayGradeDto } from '../dtos/pay-grades/update-pay-grade.dto';
import { AuthenticationGuard } from '../../auth/guards/authentication.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ConfigStatus } from '../enums/payroll-configuration-enums';
// @UseGuards(AuthGuard('jwt'), RolesGuard)

@Controller('pay-grades')
@UseGuards(AuthenticationGuard, RolesGuard) // apply auth + roles guard to all routes
export class PayGradesController {
  constructor(private readonly service: PayGradesService) {}

  @Post()
  @Roles('Payroll Specialist') // Only Admin can create pay grades
  create(@Body() dto: CreatePayGradeDto) {
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
  @Roles('Payroll Specialist') // Only Admin can update
  update(@Param('id') id: string, @Body() dto: UpdatePayGradeDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('Payroll Manager') // Only Admin can delete
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
