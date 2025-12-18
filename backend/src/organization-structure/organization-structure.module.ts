import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationStructureController } from './organization-structure.controller';
import { OrganizationStructureService } from './organization-structure.service';
import { Department, DepartmentSchema } from './models/department.schema';
import {
  PositionAssignment,
  PositionAssignmentSchema,
} from './models/position-assignment.schema';
import {
  StructureApproval,
  StructureApprovalSchema,
} from './models/structure-approval.schema';
import {
  StructureChangeLog,
  StructureChangeLogSchema,
} from './models/structure-change-log.schema';
import {
  StructureChangeRequest,
  StructureChangeRequestSchema,
} from './models/structure-change-request.schema';

// CRITICAL: Register Department in global Mongoose registry BEFORE Position schema is imported
// This ensures Department model is available when Position schema's pre-save hook initializes
const mongoose = require('mongoose');
const { model } = require('mongoose');

// Force register Department model in ALL possible locations where model() might look
// This ensures it's available when Position schema's pre-save hook tries to access it
try {
  // Register in default mongoose instance (most common location)
  if (!mongoose.models || !mongoose.models[Department.name]) {
    mongoose.model(Department.name, DepartmentSchema);
  }
  
  // Also ensure it's available via the model() function directly
  // This is what Position schema uses: model<DepartmentDocument>(Department.name)
  if (typeof model === 'function') {
    try {
      // Try to get it first to see if it exists
      model(Department.name);
    } catch (e) {
      // If it doesn't exist, register it
      if (e.message && e.message.includes('hasn\'t been registered')) {
        mongoose.model(Department.name, DepartmentSchema);
      }
    }
  }
} catch (e) {
  // Model might already be registered, ignore error
}

// NOW import Position - its pre-save hook will find Department in global registry
import { Position, PositionSchema } from './models/position.schema';

@Module({
  imports: [
    // Register Department FIRST to ensure it's available when Position schema initializes
    MongooseModule.forFeature([
      { name: Department.name, schema: DepartmentSchema },
    ]),
    // Then register Position (its pre-save hook needs Department to be registered)
    MongooseModule.forFeature([
      { name: Position.name, schema: PositionSchema },
    ]),
    // Register remaining schemas
    MongooseModule.forFeature([
      { name: PositionAssignment.name, schema: PositionAssignmentSchema },
      { name: StructureApproval.name, schema: StructureApprovalSchema },
      { name: StructureChangeLog.name, schema: StructureChangeLogSchema },
      {
        name: StructureChangeRequest.name,
        schema: StructureChangeRequestSchema,
      },
    ]),
  ],
  controllers: [OrganizationStructureController],
  providers: [OrganizationStructureService],
  exports: [OrganizationStructureService],
})
export class OrganizationStructureModule {}
