import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmployeeSystemRole, EmployeeSystemRoleDocument } from '../employee-profile/models/employee-system-role.schema';
import { SystemRole } from '../employee-profile/enums/employee-profile.enums';
import { Types } from 'mongoose';

@Injectable()
export class AuthorizationService {
  constructor(
    @InjectModel(EmployeeSystemRole.name)
    private employeeSystemRoleModel: Model<EmployeeSystemRoleDocument>,
  ) {}

  /**
   * Get roles for an employee profile
   */
  async getEmployeeRoles(employeeProfileId: string | Types.ObjectId): Promise<SystemRole[]> {
    const systemRole = await this.employeeSystemRoleModel
      .findOne({
        employeeProfileId,
        isActive: true,
      })
      .exec();

    return systemRole?.roles || [];
  }

  /**
   * Get permissions for an employee profile
   */
  async getEmployeePermissions(employeeProfileId: string | Types.ObjectId): Promise<string[]> {
    const systemRole = await this.employeeSystemRoleModel
      .findOne({
        employeeProfileId,
        isActive: true,
      })
      .exec();

    return systemRole?.permissions || [];
  }

  /**
   * Check if employee has a specific role
   */
  async hasRole(
    employeeProfileId: string | Types.ObjectId,
    role: SystemRole,
  ): Promise<boolean> {
    const roles = await this.getEmployeeRoles(employeeProfileId);
    return roles.includes(role);
  }

  /**
   * Check if employee has any of the specified roles
   */
  async hasAnyRole(
    employeeProfileId: string | Types.ObjectId,
    roles: SystemRole[],
  ): Promise<boolean> {
    const employeeRoles = await this.getEmployeeRoles(employeeProfileId);
    return roles.some((role) => employeeRoles.includes(role));
  }

  /**
   * Check if employee has all of the specified roles
   */
  async hasAllRoles(
    employeeProfileId: string | Types.ObjectId,
    roles: SystemRole[],
  ): Promise<boolean> {
    const employeeRoles = await this.getEmployeeRoles(employeeProfileId);
    return roles.every((role) => employeeRoles.includes(role));
  }

  /**
   * Check if employee has a specific permission
   */
  async hasPermission(
    employeeProfileId: string | Types.ObjectId,
    permission: string,
  ): Promise<boolean> {
    const permissions = await this.getEmployeePermissions(employeeProfileId);
    return permissions.includes(permission);
  }

  /**
   * Check if employee has all of the specified permissions
   */
  async hasAllPermissions(
    employeeProfileId: string | Types.ObjectId,
    permissions: string[],
  ): Promise<boolean> {
    const employeePermissions = await this.getEmployeePermissions(employeeProfileId);
    return permissions.every((permission) =>
      employeePermissions.includes(permission),
    );
  }

  /**
   * Check if employee has any of the specified permissions
   */
  async hasAnyPermission(
    employeeProfileId: string | Types.ObjectId,
    permissions: string[],
  ): Promise<boolean> {
    const employeePermissions = await this.getEmployeePermissions(employeeProfileId);
    return permissions.some((permission) =>
      employeePermissions.includes(permission),
    );
  }

  /**
   * Get full authorization context for an employee
   */
  async getAuthorizationContext(employeeProfileId: string | Types.ObjectId) {
    const systemRole = await this.employeeSystemRoleModel
      .findOne({
        employeeProfileId,
        isActive: true,
      })
      .exec();

    return {
      roles: systemRole?.roles || [],
      permissions: systemRole?.permissions || [],
      isActive: systemRole?.isActive || false,
    };
  }
}

