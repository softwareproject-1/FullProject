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
import { PayTypeService } from '../services/pay-type.service';
import { CreatePayTypeDto } from '../dtos/pay-type/create-pay-type.dto';
import { UpdatePayTypeDto } from '../dtos/pay-type/update-pay-type.dto';
import { Roles } from '../../auth/decorators/roles.decorator'; // import from auth
import { RolesGuard } from '../../auth/guards/roles.guard'; // import from auth
import { AuthGuard } from '@nestjs/passport'; // JWT auth
@Controller('pay-types')
@UseGuards(AuthGuard('jwt'), RolesGuard) // apply auth + roles guard to all routes
export class PayTypeController {
  constructor(private readonly service: PayTypeService) {}

  @Post()
  @Roles('Payroll Specialist') // Only Admin can create
  create(@Body() dto: CreatePayTypeDto) {
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
  update(@Param('id') id: string, @Body() dto: UpdatePayTypeDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
   @Roles('Payroll Specialist') // Only Admin can delete
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
