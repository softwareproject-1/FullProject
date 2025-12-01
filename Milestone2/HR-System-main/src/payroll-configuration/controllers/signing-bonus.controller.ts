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
import { SigningBonusService } from '../services/signing-bonus.service';
import { CreateSigningBonusDto } from '../dtos/signing-bonus/create-signing-bonus.dto';
import { UpdateSigningBonusDto } from '../dtos/signing-bonus/update-signing-bonus.dto';
import { Roles } from '../../auth/decorators/roles.decorator'; // import from auth
import { RolesGuard } from '../../auth/guards/roles.guard'; // import from auth
import { AuthGuard } from '@nestjs/passport'; // JWT auth
// @UseGuards(AuthGuard('jwt'), RolesGuard)

@Controller('signing-bonuses')
@UseGuards(AuthGuard('jwt'), RolesGuard) // apply auth + roles guard to all routes

export class SigningBonusController {
  constructor(private readonly service: SigningBonusService) {}

  @Post()
  @Roles('Payroll Specialist') // Only Admin can create
  create(@Body() dto: CreateSigningBonusDto) {
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
  update(@Param('id') id: string, @Body() dto: UpdateSigningBonusDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
    @Roles('Payroll Specialist') // Only Admin can delete
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
