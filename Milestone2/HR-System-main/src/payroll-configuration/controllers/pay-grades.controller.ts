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
// import { AuthGuard } from '@nestjs/passport';
// import { RolesGuard } from '../guards/roles.guard';
// import { Roles } from '../guards/roles.decorator';
// @UseGuards(AuthGuard('jwt'), RolesGuard)

@Controller('pay-grades')
export class PayGradesController {
  constructor(private readonly service: PayGradesService) {}

  @Post()
  // @Roles('Payroll Specialist') // Only Admin can create pay grades
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
  //   @Roles('Payroll Specialist') // Only Admin can update
  update(@Param('id') id: string, @Body() dto: UpdatePayGradeDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  //   @Roles('Payroll Specialist') // Only Admin can delete
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
