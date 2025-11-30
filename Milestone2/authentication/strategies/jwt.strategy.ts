import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmployeeProfile, EmployeeProfileDocument } from '../../employee-profile/models/employee-profile.schema';
import { EmployeeSystemRole, EmployeeSystemRoleDocument } from '../../employee-profile/models/employee-system-role.schema';
import { EmployeeStatus } from '../../employee-profile/enums/employee-profile.enums';

export interface JwtPayload {
  sub: string; // employeeProfileId
  nationalId: string;
  employeeNumber: string;
  roles?: string[];
  permissions?: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectModel(EmployeeProfile.name)
    private employeeProfileModel: Model<EmployeeProfileDocument>,
    @InjectModel(EmployeeSystemRole.name)
    private employeeSystemRoleModel: Model<EmployeeSystemRoleDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    // Verify employee profile exists and is active
    const employeeProfile = await this.employeeProfileModel
      .findById(payload.sub)
      .exec();

    if (!employeeProfile) {
      throw new UnauthorizedException('Employee profile not found');
    }

    // Check if employee is active
    if (employeeProfile.status !== EmployeeStatus.ACTIVE) {
      throw new UnauthorizedException('Employee account is not active');
    }

    // Fetch roles and permissions from EmployeeSystemRole
    const systemRole = await this.employeeSystemRoleModel
      .findOne({
        employeeProfileId: new Types.ObjectId(payload.sub),
        isActive: true,
      })
      .exec();

    return {
      employeeProfileId: payload.sub,
      nationalId: payload.nationalId,
      employeeNumber: payload.employeeNumber,
      roles: systemRole?.roles || [],
      permissions: systemRole?.permissions || [],
      employeeProfile,
    };
  }
}

