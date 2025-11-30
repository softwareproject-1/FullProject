import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { EmployeeProfile, EmployeeProfileDocument } from '../employee-profile/models/employee-profile.schema';
import { EmployeeSystemRole, EmployeeSystemRoleDocument } from '../employee-profile/models/employee-system-role.schema';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { SystemRole } from '../employee-profile/enums/employee-profile.enums';
import { EmployeeStatus } from '../employee-profile/enums/employee-profile.enums';

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
    // Check if nationalId already exists
    const existingByNationalId = await this.employeeProfileModel
      .findOne({ nationalId: registerDto.nationalId })
      .exec();

    if (existingByNationalId) {
      throw new ConflictException('National ID already registered');
    }

    // Check if employeeNumber already exists
    const existingByEmployeeNumber = await this.employeeProfileModel
      .findOne({ employeeNumber: registerDto.employeeNumber })
      .exec();

    if (existingByEmployeeNumber) {
      throw new ConflictException('Employee number already exists');
    }

    // Check if workEmail already exists (if provided)
    if (registerDto.workEmail) {
      const existingByEmail = await this.employeeProfileModel
        .findOne({ workEmail: registerDto.workEmail })
        .exec();

      if (existingByEmail) {
        throw new ConflictException('Work email already registered');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create employee profile
    const employeeProfile = new this.employeeProfileModel({
      firstName: registerDto.firstName,
      middleName: registerDto.middleName,
      lastName: registerDto.lastName,
      nationalId: registerDto.nationalId,
      password: hashedPassword,
      personalEmail: registerDto.personalEmail,
      mobilePhone: registerDto.mobilePhone,
      employeeNumber: registerDto.employeeNumber,
      dateOfHire: registerDto.dateOfHire,
      workEmail: registerDto.workEmail,
      status: EmployeeStatus.ACTIVE,
    });

    await employeeProfile.save();

    // Create default system role (DEPARTMENT_EMPLOYEE)
    const systemRole = new this.employeeSystemRoleModel({
      employeeProfileId: employeeProfile._id,
      roles: [SystemRole.DEPARTMENT_EMPLOYEE],
      permissions: [],
      isActive: true,
    });

    await systemRole.save();

    // Update employee profile with accessProfileId
    employeeProfile.accessProfileId = systemRole._id;
    await employeeProfile.save();

    // Generate JWT token
    const payload: JwtPayload = {
      sub: employeeProfile._id.toString(),
      nationalId: employeeProfile.nationalId,
      employeeNumber: employeeProfile.employeeNumber,
      roles: systemRole.roles,
      permissions: systemRole.permissions,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      employeeProfile: {
        id: employeeProfile._id,
        nationalId: employeeProfile.nationalId,
        employeeNumber: employeeProfile.employeeNumber,
        firstName: employeeProfile.firstName,
        lastName: employeeProfile.lastName,
        workEmail: employeeProfile.workEmail,
      },
      roles: systemRole.roles,
      permissions: systemRole.permissions,
    };
  }

  async login(loginDto: LoginDto) {
    // Validate that at least one identifier is provided
    if (!loginDto.nationalId && !loginDto.workEmail && !loginDto.personalEmail) {
      throw new UnauthorizedException('Either nationalId, workEmail, or personalEmail must be provided');
    }

    // Find employee by nationalId, workEmail, or personalEmail
    let employeeProfile: EmployeeProfileDocument | null = null;

    if (loginDto.workEmail) {
      employeeProfile = await this.employeeProfileModel
        .findOne({ workEmail: loginDto.workEmail })
        .exec();
    } else if (loginDto.personalEmail) {
      employeeProfile = await this.employeeProfileModel
        .findOne({ personalEmail: loginDto.personalEmail })
        .exec();
    } else if (loginDto.nationalId) {
      employeeProfile = await this.employeeProfileModel
        .findOne({ nationalId: loginDto.nationalId })
        .exec();
    }

    if (!employeeProfile) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if employee is active
    if (employeeProfile.status !== EmployeeStatus.ACTIVE) {
      throw new UnauthorizedException('Employee account is not active');
    }

    // Verify password
    if (!employeeProfile.password) {
      throw new UnauthorizedException('Password not set for this account');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      employeeProfile.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Fetch roles and permissions
    const systemRole = await this.employeeSystemRoleModel
      .findOne({
        employeeProfileId: employeeProfile._id,
        isActive: true,
      })
      .exec();

    // Generate JWT token
    const payload: JwtPayload = {
      sub: employeeProfile._id.toString(),
      nationalId: employeeProfile.nationalId,
      employeeNumber: employeeProfile.employeeNumber,
      roles: systemRole?.roles || [],
      permissions: systemRole?.permissions || [],
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      employeeProfile: {
        id: employeeProfile._id,
        nationalId: employeeProfile.nationalId,
        employeeNumber: employeeProfile.employeeNumber,
        firstName: employeeProfile.firstName,
        lastName: employeeProfile.lastName,
        workEmail: employeeProfile.workEmail,
      },
      roles: systemRole?.roles || [],
      permissions: systemRole?.permissions || [],
    };
  }

  async validateUser(userId: string) {
    const employeeProfile = await this.employeeProfileModel
      .findById(userId)
      .exec();

    if (!employeeProfile || employeeProfile.status !== EmployeeStatus.ACTIVE) {
      return null;
    }

    const systemRole = await this.employeeSystemRoleModel
      .findOne({
        employeeProfileId: employeeProfile._id,
        isActive: true,
      })
      .exec();

    return {
      employeeProfileId: employeeProfile._id.toString(),
      nationalId: employeeProfile.nationalId,
      employeeNumber: employeeProfile.employeeNumber,
      roles: systemRole?.roles || [],
      permissions: systemRole?.permissions || [],
    };
  }
}

