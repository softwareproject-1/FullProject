import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { TaxDocumentService } from '../services/tax-document.service';
import { CreateTaxDocumentDto } from '../dto/create-tax-document.dto';
import { UpdateTaxDocumentDto } from '../dto/update-tax-document.dto';
import { TaxDocument } from '../schemas/tax-document.schema';

@Controller('api/v1/tax-documents')
export class TaxDocumentController {
  constructor(private readonly taxDocumentService: TaxDocumentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTaxDocumentDto: CreateTaxDocumentDto): Promise<TaxDocument> {
    return this.taxDocumentService.create(createTaxDocumentDto);
  }

  @Get()
  async findAll(): Promise<TaxDocument[]> {
    return this.taxDocumentService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TaxDocument> {
    return this.taxDocumentService.findOne(id);
  }

  @Get('employee/:employeeId')
  async findByEmployee(@Param('employeeId') employeeId: string): Promise<TaxDocument[]> {
    return this.taxDocumentService.findByEmployee(employeeId);
  }

  @Get('employee/:employeeId/year/:year')
  async findByEmployeeAndYear(
    @Param('employeeId') employeeId: string,
    @Param('year', ParseIntPipe) year: number,
  ): Promise<TaxDocument[]> {
    return this.taxDocumentService.findByEmployeeAndYear(employeeId, year);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTaxDocumentDto: UpdateTaxDocumentDto,
  ): Promise<TaxDocument> {
    return this.taxDocumentService.update(id, updateTaxDocumentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.taxDocumentService.remove(id);
  }
}
