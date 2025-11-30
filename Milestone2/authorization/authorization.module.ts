import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthorizationService } from './authorization.service';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { EmployeeSystemRole, EmployeeSystemRoleSchema } from '../employee-profile/models/employee-system-role.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmployeeSystemRole.name, schema: EmployeeSystemRoleSchema },
    ]),
  ],
  providers: [AuthorizationService, RolesGuard, PermissionsGuard],
  exports: [AuthorizationService, RolesGuard, PermissionsGuard],
})
export class AuthorizationModule {}

