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
import { RegisterCandidateDto } from './dto/register-candidate.dto';
import { SystemRole, EmployeeStatus, CandidateStatus } from '../employee-profile/enums/employee-profile.enums';
import { Types } from 'mongoose';
import { Candidate, CandidateDocument } from '../employee-profile/models/candidate.schema';

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
    @InjectModel(Candidate.name)
    private candidateModel: Model<CandidateDocument>,
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
        personalEmail: employeeProfile.personalEmail,
        profilePictureUrl: employeeProfile.profilePictureUrl,
        roles: systemRole.roles,
        permissions: systemRole.permissions,
      },
    };
  }

  async registerCandidate(registerDto: RegisterCandidateDto) {
    // Check if national ID already exists in employee profiles
    const existingEmployeeByNationalId = await this.employeeProfileModel
      .findOne({ nationalId: registerDto.nationalId })
      .exec();

    if (existingEmployeeByNationalId) {
      throw new ConflictException('National ID already registered');
    }

    // Check if national ID already exists in candidate profiles
    const existingCandidateByNationalId = await this.candidateModel
      .findOne({ nationalId: registerDto.nationalId })
      .exec();

    if (existingCandidateByNationalId) {
      throw new ConflictException('National ID already registered as a candidate');
    }

    // Check if personal email already exists in employee profiles
    if (registerDto.personalEmail) {
      const existingEmployeeByEmail = await this.employeeProfileModel
        .findOne({ personalEmail: registerDto.personalEmail })
        .exec();

      if (existingEmployeeByEmail) {
        throw new ConflictException('Email already registered');
      }

      // Check if personal email already exists in candidate profiles
      const existingCandidateByEmail = await this.candidateModel
        .findOne({ personalEmail: registerDto.personalEmail })
        .exec();

      if (existingCandidateByEmail) {
        throw new ConflictException('Email already registered as a candidate');
      }
    }

    // Generate a temporary employee number for authentication purposes
    const timestamp = Date.now();
    let employeeNumber = `CAND-${timestamp}`;
    let employeeExists = await this.employeeProfileModel.findOne({ employeeNumber }).exec();
    let counter = 1;
    while (employeeExists) {
      employeeNumber = `CAND-${timestamp}-${counter}`;
      employeeExists = await this.employeeProfileModel.findOne({ employeeNumber }).exec();
      counter++;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create employee profile for authentication (required for login)
    const employeeProfile = new this.employeeProfileModel({
      firstName: registerDto.firstName,
      middleName: registerDto.middleName,
      lastName: registerDto.lastName,
      nationalId: registerDto.nationalId,
      password: hashedPassword,
      personalEmail: registerDto.personalEmail,
      mobilePhone: registerDto.mobilePhone,
      employeeNumber: employeeNumber,
      dateOfHire: new Date(), // Use current date as placeholder
      status: EmployeeStatus.ACTIVE,
    });

    await employeeProfile.save();

    // Create system role with Job Candidate role
    const systemRole = new this.employeeSystemRoleModel({
      employeeProfileId: employeeProfile._id,
      roles: [SystemRole.JOB_CANDIDATE],
      permissions: [],
      isActive: true,
    });

    await systemRole.save();

    employeeProfile.accessProfileId = systemRole._id;
    await employeeProfile.save();

    // Generate candidate number
    let candidateNumber = `CAND-${timestamp}`;
    let candidateExists = await this.candidateModel.findOne({ candidateNumber }).exec();
    counter = 1;
    while (candidateExists) {
      candidateNumber = `CAND-${timestamp}-${counter}`;
      candidateExists = await this.candidateModel.findOne({ candidateNumber }).exec();
      counter++;
    }

    // Create candidate profile
    const candidate = new this.candidateModel({
      candidateNumber,
      firstName: registerDto.firstName,
      middleName: registerDto.middleName,
      lastName: registerDto.lastName,
      fullName: `${registerDto.firstName} ${registerDto.middleName || ''} ${registerDto.lastName}`.trim(),
      nationalId: registerDto.nationalId,
      personalEmail: registerDto.personalEmail,
      mobilePhone: registerDto.mobilePhone,
      dateOfBirth: registerDto.dateOfBirth ? new Date(registerDto.dateOfBirth) : undefined,
      status: CandidateStatus.APPLIED,
      applicationDate: new Date(),
      accessProfileId: systemRole._id,
    });

    await candidate.save();

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
      access_token: accessToken,
      payload: {
        id: employeeProfile._id,
        nationalId: employeeProfile.nationalId,
        employeeNumber: employeeProfile.employeeNumber,
        firstName: employeeProfile.firstName,
        lastName: employeeProfile.lastName,
        personalEmail: employeeProfile.personalEmail,
        profilePictureUrl: employeeProfile.profilePictureUrl,
        roles: systemRole.roles,
        permissions: systemRole.permissions,
      },
    };
  }

  async signIn(identifier: string, password: string) {
    let employeeProfile: EmployeeProfileDocument | null = null;

    try {
      employeeProfile = await this.employeeProfileModel
        .findOne({ workEmail: identifier })
        .maxTimeMS(5000)
        .exec();

      if (!employeeProfile) {
        employeeProfile = await this.employeeProfileModel
          .findOne({ personalEmail: identifier })
          .maxTimeMS(5000)
          .exec();
      }

      if (!employeeProfile) {
        employeeProfile = await this.employeeProfileModel
          .findOne({ nationalId: identifier })
          .maxTimeMS(5000)
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
    } catch (error: any) {
      // If it's already an UnauthorizedException, re-throw it
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // For database errors, log and throw a more user-friendly error
      console.error('signIn - Database error during authentication:', error);
      throw new UnauthorizedException('Authentication failed. Please try again.');
    }

    // Find the most recent active role (sorted by updatedAt descending)
    // This ensures we get the latest role assignment if multiple exist
    // Convert employeeProfile._id to ObjectId to ensure proper matching
    // Handle both string and ObjectId formats
    // WRAP ENTIRE ROLE LOOKUP IN A TIMEOUT PROMISE TO PREVENT HANGING
    let systemRole: EmployeeSystemRoleDocument | null = null;
    
    // Declare these outside try block so they're available in the else block below
    const employeeProfileId = employeeProfile._id instanceof Types.ObjectId 
      ? employeeProfile._id 
      : new Types.ObjectId(employeeProfile._id);
    const employeeProfileIdString = String(employeeProfile._id);
    
    // SIMPLIFIED ROLE LOOKUP - Fast and non-blocking
    // If it fails or times out, user can still login with empty roles
    try {
      console.log('signIn - Looking for roles with employeeProfileId:', {
        asObjectId: employeeProfileId.toString(),
        asString: employeeProfileIdString,
      });
      
      // Simple, fast query - just get the first active role
      // Use a very short timeout (2 seconds) to prevent hanging
      const systemRoles = await this.employeeSystemRoleModel
        .findOne({
          $or: [
            { employeeProfileId: employeeProfileId },
            { employeeProfileId: employeeProfileIdString },
          ],
          isActive: true,
        })
        .sort({ updatedAt: -1 })
        .maxTimeMS(2000) // Very short timeout - 2 seconds max
        .exec();
      
      systemRole = systemRoles;
      
      if (systemRole) {
        console.log('signIn - Found role for employee:', employeeProfile.employeeNumber);
      } else {
        console.log('signIn - No active role found for employee:', employeeProfile.employeeNumber);
      }
    } catch (roleError: any) {
      // Log the error but don't fail the login - allow user to login with empty roles
      console.warn('signIn - Role lookup failed for employee:', employeeProfile.employeeNumber, roleError.message);
      // Continue with null systemRole - user will have empty roles array
      systemRole = null;
    }

    console.log('signIn - Employee ID:', employeeProfile._id);
    console.log('signIn - Employee Number:', employeeProfile.employeeNumber);
    console.log('signIn - System Role found:', systemRole ? 'Yes' : 'No');
    if (systemRole) {
      const systemRoleObj = systemRole.toObject();
      console.log('signIn - System Role document (most recent active):', {
        _id: systemRole._id,
        roles: systemRole.roles,
        rolesType: typeof systemRole.roles,
        isArray: Array.isArray(systemRole.roles),
        permissions: systemRole.permissions,
        isActive: systemRole.isActive,
        updatedAt: (systemRoleObj as any).updatedAt,
        createdAt: (systemRoleObj as any).createdAt,
      });
    } else {
      // If no active role found, check for any role (including inactive)
      try {
        const anyRole = await this.employeeSystemRoleModel
          .findOne({
            employeeProfileId: employeeProfileId,
          })
          .sort({ updatedAt: -1 })
          .maxTimeMS(5000) // 5 second timeout
          .exec();
      
      if (anyRole) {
        const anyRoleObj = anyRole.toObject();
        console.warn('signIn - No active role found, but found inactive role:', {
          _id: anyRole._id,
          roles: anyRole.roles,
          isActive: anyRole.isActive,
          updatedAt: (anyRoleObj as any).updatedAt,
        });
        console.warn('signIn - This employee has no active system role!');
      } else {
        console.warn('signIn - No system role document found at all for this employee!');
      }
      } catch (anyRoleError: any) {
        console.error('signIn - Error checking for any role:', anyRoleError);
      }
    }

    // Ensure roles is always an array and normalize them
    // Wrap in try-catch to ensure we always return something even if role processing fails
    let rolesArray: string[] = [];
    
    try {
      let roles: any = systemRole?.roles || [];
      
      if (Array.isArray(roles)) {
        // Normalize roles to match enum values
        const validRoles = Object.values(SystemRole);
        rolesArray = roles
          .map(role => {
            const roleStr = String(role).trim();
            // Check exact match first
            if (validRoles.includes(roleStr as SystemRole)) {
              return roleStr;
            }
            // Try case-insensitive match
            const matched = validRoles.find(
              validRole => validRole.toLowerCase() === roleStr.toLowerCase()
            );
            if (matched) {
              console.log(`signIn - Normalized role "${roleStr}" to "${matched}"`);
              return matched;
            }
            console.warn(`signIn - Invalid role found: "${roleStr}"`);
            return roleStr; // Keep original even if invalid
          })
          .filter(role => role && role.length > 0);
      }
      
      console.log('signIn - Roles from DB (raw):', roles);
      console.log('signIn - Roles array (normalized):', rolesArray);
      console.log('signIn - Has System Admin:', rolesArray.includes(SystemRole.SYSTEM_ADMIN));
    } catch (roleProcessingError: any) {
      console.error('signIn - Error processing roles:', roleProcessingError);
      // Continue with empty roles array - user can still log in
      rolesArray = [];
    }

    // Always create payload and token, even if roles are empty
    // This ensures login succeeds even if role lookup/processing fails
    const payload: JwtPayload = {
      sub: employeeProfile._id.toString(),
      nationalId: employeeProfile.nationalId,
      employeeNumber: employeeProfile.employeeNumber,
      roles: rolesArray,
      permissions: systemRole?.permissions || [],
    };

    let accessToken: string;
    try {
      accessToken = this.jwtService.sign(payload);
    } catch (jwtError: any) {
      console.error('signIn - Error signing JWT token:', jwtError);
      throw new UnauthorizedException('Failed to create authentication token');
    }

    return {
      access_token: accessToken,
      payload: {
        id: employeeProfile._id,
        nationalId: employeeProfile.nationalId,
        employeeNumber: employeeProfile.employeeNumber,
        firstName: employeeProfile.firstName,
        lastName: employeeProfile.lastName,
        workEmail: employeeProfile.workEmail,
        roles: rolesArray,
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

  async getUserRoles(userId: string) {
    const systemRole = await this.employeeSystemRoleModel
      .findOne({
        employeeProfileId: userId,
        isActive: true,
      })
      .exec();

    console.log('getUserRoles - User ID:', userId);
    console.log('getUserRoles - System Role found:', systemRole ? 'Yes' : 'No');
    if (systemRole) {
      console.log('getUserRoles - Roles from DB (raw):', systemRole.roles);
      console.log('getUserRoles - Roles type:', typeof systemRole.roles, Array.isArray(systemRole.roles));
      console.log('getUserRoles - Permissions from DB:', systemRole.permissions);
    }

    // Ensure roles is always an array of strings
    let roles: string[] = [];
    if (systemRole?.roles) {
      if (Array.isArray(systemRole.roles)) {
        roles = systemRole.roles
          .map(role => {
            // Convert to string and trim
            const roleStr = String(role).trim();
            // Validate against enum values
            const validRoles = Object.values(SystemRole);
            if (validRoles.includes(roleStr as SystemRole)) {
              return roleStr;
            }
            // Try case-insensitive match
            const matchedRole = validRoles.find(
              validRole => validRole.toLowerCase() === roleStr.toLowerCase()
            );
            if (matchedRole) {
              console.log(`getUserRoles - Normalized role "${roleStr}" to "${matchedRole}"`);
              return matchedRole;
            }
            console.warn(`getUserRoles - Invalid role found: "${roleStr}"`);
            return null;
          })
          .filter((role): role is string => role !== null);
      } else {
        console.warn('getUserRoles - Roles is not an array:', systemRole.roles);
      }
    }

    console.log('getUserRoles - Processed roles:', roles);
    console.log('getUserRoles - Has System Admin:', roles.includes(SystemRole.SYSTEM_ADMIN));

    return {
      roles: roles,
      permissions: systemRole?.permissions || [],
    };
  }

  async adminResetPassword(employeeId: string, newPassword: string, forcePasswordChange: boolean = false) {
    const employeeProfile = await this.employeeProfileModel.findById(employeeId).exec();

    if (!employeeProfile) {
      throw new UnauthorizedException('Employee not found');
    }

    if (employeeProfile.status !== EmployeeStatus.ACTIVE) {
      throw new UnauthorizedException('Cannot reset password for inactive employee');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    employeeProfile.password = hashedPassword;
    
    // If forcePasswordChange is true, you could add a flag to the employee profile
    // For now, we'll just update the password
    // In a more advanced implementation, you could add a `mustChangePassword` field
    
    await employeeProfile.save();

    return {
      message: 'Password reset successfully',
      employeeId: employeeProfile._id,
      employeeNumber: employeeProfile.employeeNumber,
      forcePasswordChange,
    };
  }
}

