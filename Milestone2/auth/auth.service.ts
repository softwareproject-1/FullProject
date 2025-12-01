import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { EmployeeProfile, EmployeeProfileDocument } from '../employee-profile/models/employee-profile.schema';
import { EmployeeSystemRole, EmployeeSystemRoleDocument } from '../employee-profile/models/employee-system-role.schema';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SystemRole, EmployeeStatus } from '../employee-profile/enums/employee-profile.enums';

export interface JwtPayload {
  sub: string;
  nationalId: string;
  employeeNumber: string;
  roles?: string[];
  permissions?: string[];
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(EmployeeProfile.name)
    private employeeProfileModel: Model<EmployeeProfileDocument>,
    @InjectModel(EmployeeSystemRole.name)
    private employeeSystemRoleModel: Model<EmployeeSystemRoleDocument>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingByNationalId = await this.employeeProfileModel
      .findOne({ nationalId: registerDto.nationalId })
      .exec();

    if (existingByNationalId) {
      throw new ConflictException('National ID already registered');
    }

    const existingByEmployeeNumber = await this.employeeProfileModel
      .findOne({ employeeNumber: registerDto.employeeNumber })
      .exec();

    if (existingByEmployeeNumber) {
      throw new ConflictException('Employee number already exists');
    }

    if (registerDto.workEmail) {
      const existingByEmail = await this.employeeProfileModel
        .findOne({ workEmail: registerDto.workEmail })
        .exec();

      if (existingByEmail) {
        throw new ConflictException('Work email already registered');
      }
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const employeeProfile = new this.employeeProfileModel({
      firstName: registerDto.firstName,
      middleName: registerDto.middleName,
      lastName: registerDto.lastName,
      nationalId: registerDto.nationalId,
      password: hashedPassword,
      personalEmail: registerDto.personalEmail,
      mobilePhone: registerDto.mobilePhone,
      employeeNumber: registerDto.employeeNumber,
      dateOfHire: new Date(registerDto.dateOfHire),
      workEmail: registerDto.workEmail,
      status: EmployeeStatus.ACTIVE,
    });

    await employeeProfile.save();

    const systemRole = new this.employeeSystemRoleModel({
      employeeProfileId: employeeProfile._id,
      roles: [SystemRole.DEPARTMENT_EMPLOYEE],
      permissions: [],
      isActive: true,
    });

    await systemRole.save();

    employeeProfile.accessProfileId = systemRole._id;
    await employeeProfile.save();

    const payload: JwtPayload = {
      sub: employeeProfile._id.toString(),
      nationalId: employeeProfile.nationalId,
      employeeNumber: employeeProfile.employeeNumber,
      roles: systemRole.roles,
      permissions: systemRole.permissions,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      payload: {
        id: employeeProfile._id,
        nationalId: employeeProfile.nationalId,
        employeeNumber: employeeProfile.employeeNumber,
        firstName: employeeProfile.firstName,
        lastName: employeeProfile.lastName,
        workEmail: employeeProfile.workEmail,
        roles: systemRole.roles,
        permissions: systemRole.permissions,
      },
    };
  }

  async signIn(identifier: string, password: string) {
    let employeeProfile: EmployeeProfileDocument | null = null;

    employeeProfile = await this.employeeProfileModel
      .findOne({ workEmail: identifier })
      .exec();

    if (!employeeProfile) {
      employeeProfile = await this.employeeProfileModel
        .findOne({ personalEmail: identifier })
        .exec();
    }

    if (!employeeProfile) {
      employeeProfile = await this.employeeProfileModel
        .findOne({ nationalId: identifier })
        .exec();
    }

    if (!employeeProfile) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (employeeProfile.status !== EmployeeStatus.ACTIVE) {
      throw new UnauthorizedException('Employee account is not active');
    }

    if (!employeeProfile.password) {
      throw new UnauthorizedException('Password not set for this account');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      employeeProfile.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const systemRole = await this.employeeSystemRoleModel
      .findOne({
        employeeProfileId: employeeProfile._id,
        isActive: true,
      })
      .exec();

    const payload: JwtPayload = {
      sub: employeeProfile._id.toString(),
      nationalId: employeeProfile.nationalId,
      employeeNumber: employeeProfile.employeeNumber,
      roles: systemRole?.roles || [],
      permissions: systemRole?.permissions || [],
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      payload: {
        id: employeeProfile._id,
        nationalId: employeeProfile.nationalId,
        employeeNumber: employeeProfile.employeeNumber,
        firstName: employeeProfile.firstName,
        lastName: employeeProfile.lastName,
        workEmail: employeeProfile.workEmail,
        roles: systemRole?.roles || [],
        permissions: systemRole?.permissions || [],
      },
    };
  }

  async findById(userId: string) {
    const employeeProfile = await this.employeeProfileModel
      .findById(userId)
      .exec();

    if (!employeeProfile) {
      return null;
    }

    return employeeProfile;
  }
}

