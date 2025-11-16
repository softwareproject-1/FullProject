import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TaxDocument, TaxDocumentDocument } from '../schemas/tax-document.schema';
import { CreateTaxDocumentDto } from '../dto/create-tax-document.dto';
import { UpdateTaxDocumentDto } from '../dto/update-tax-document.dto';

@Injectable()
export class TaxDocumentService {
  constructor(
    @InjectModel(TaxDocument.name)
    private taxDocumentModel: Model<TaxDocumentDocument>,
  ) {}

  async create(createTaxDocumentDto: CreateTaxDocumentDto): Promise<TaxDocument> {
    const createdTaxDocument = new this.taxDocumentModel({
      ...createTaxDocumentDto,
      employee: new Types.ObjectId(createTaxDocumentDto.employee),
    });
    return createdTaxDocument.save();
  }

  async findAll(): Promise<TaxDocument[]> {
    return this.taxDocumentModel
      .find()
      .sort({ year: -1, generatedAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<TaxDocument> {
    const taxDocument = await this.taxDocumentModel.findById(id).exec();

    if (!taxDocument) {
      throw new NotFoundException(`Tax document with ID ${id} not found`);
    }
    return taxDocument;
  }

  async findByEmployee(employeeId: string): Promise<TaxDocument[]> {
    return this.taxDocumentModel
      .find({ employee: new Types.ObjectId(employeeId) })
      .sort({ year: -1, generatedAt: -1 })
      .exec();
  }

  async findByEmployeeAndYear(employeeId: string, year: number): Promise<TaxDocument[]> {
    return this.taxDocumentModel
      .find({
        employee: new Types.ObjectId(employeeId),
        year: year,
      })
      .sort({ generatedAt: -1 })
      .exec();
  }

  async update(id: string, updateTaxDocumentDto: UpdateTaxDocumentDto): Promise<TaxDocument> {
    const updateData: any = { ...updateTaxDocumentDto };

    // Convert string ID to ObjectId if provided
    if (updateTaxDocumentDto.employee) {
      updateData.employee = new Types.ObjectId(updateTaxDocumentDto.employee);
    }

    const updatedTaxDocument = await this.taxDocumentModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedTaxDocument) {
      throw new NotFoundException(`Tax document with ID ${id} not found`);
    }
    return updatedTaxDocument;
  }

  async remove(id: string): Promise<void> {
    const result = await this.taxDocumentModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Tax document with ID ${id} not found`);
    }
  }
}
