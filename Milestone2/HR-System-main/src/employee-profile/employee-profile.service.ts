import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, SortOrder } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {
  EmployeeProfile,
  EmployeeProfileDocument,
} from './models/employee-profile.schema';
import { Candidate, CandidateDocument } from './models/candidate.schema';
import { EmployeeQualification } from './models/qualification.schema';
import { CreateEmployeeProfileDto } from './dto/create-employee-profile.dto';
import { UpdateEmployeeProfileDto } from './dto/update-employee-profile.dto';
import { EmployeeProfileFilterDto } from './dto/employee-profile-filter.dto';
import { CandidateFilterDto } from './dto/candidate-filter.dto';
import { UpdateEmploymentStateDto } from './dto/update-employment-state.dto';
import { AssignSupervisorDto } from './dto/assign-supervisor.dto';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { UpdateCandidateStatusDto } from './dto/update-candidate-status.dto';
import { ConvertCandidateDto } from './dto/convert-candidate.dto';
import {
  CandidateStatus,
  EmployeeStatus,
  SystemRole,
} from './enums/employee-profile.enums';
import { CreateEmployeeQualificationDto } from './dto/create-employee-qualification.dto';
import { UpdateEmployeeQualificationDto } from './dto/update-employee-qualification.dto';
import {
  EmployeeSystemRole,
  EmployeeSystemRoleDocument,
} from './models/employee-system-role.schema';
import { CreateEmployeeSystemRoleDto } from './dto/create-employee-system-role.dto';
import { UpdateEmployeeSystemRoleDto } from './dto/update-employee-system-role.dto';
import { EmployeeProfileChangeRequest } from './models/ep-change-request.schema';
import { CreateEmployeeProfileChangeRequestDto } from './dto/create-employee-profile-change-request.dto';
import { UpdateEmployeeProfileChangeRequestDto } from './dto/update-employee-profile-change-request.dto';

@Injectable()
export class EmployeeProfileService {
  private readonly allowedPopulatePaths = [
    'primaryDepartmentId',
    'primaryPositionId',
    'supervisorPositionId',
    'payGradeId',
    'lastAppraisalRecordId',
    'lastAppraisalCycleId',
    'lastAppraisalTemplateId',
  ] as const;

  constructor(
    @InjectModel(EmployeeProfile.name)
    private readonly employeeProfileModel: Model<EmployeeProfileDocument>,
    @InjectModel(Candidate.name)
    private readonly candidateModel: Model<CandidateDocument>,
    @InjectModel(EmployeeQualification.name)
    private readonly qualificationModel: Model<EmployeeQualification>,
    @InjectModel(EmployeeSystemRole.name)
    private readonly systemRoleModel: Model<EmployeeSystemRoleDocument>,
    @InjectModel(EmployeeProfileChangeRequest.name)
    private readonly changeRequestModel: Model<EmployeeProfileChangeRequest>,
  ) { }

  async createProfile(createDto: CreateEmployeeProfileDto) {
    await this.ensureUniqueIdentifiers(createDto);

    const {
      orgLinks,
      performanceSnapshot,
      permissions, // handled by access control flows, not stored on profile document
      password,
      ...profileData
    } = createDto;

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const basePayload = this.normalizeDateFields(
      {
        ...profileData,
        ...(hashedPassword && { password: hashedPassword }),
      },
      ['dateOfHire', 'contractStartDate', 'contractEndDate', 'dateOfBirth', 'statusEffectiveFrom'],
    );

    const orgLinkPayload = this.buildOrgLinkPayload(orgLinks);
    const performancePayload =
      this.buildPerformanceSnapshotPayload(performanceSnapshot);

    const createdProfile = await this.employeeProfileModel.create({
      ...basePayload,
      ...orgLinkPayload,
      ...performancePayload,
    });

    return createdProfile.toObject();
  }

  async updateProfile(
    profileId: string,
    updateDto: UpdateEmployeeProfileDto,
  ) {
    const profile = await this.employeeProfileModel.findById(profileId);
    if (!profile) {
      throw new NotFoundException('Employee profile not found.');
    }

    if (updateDto.employeeNumber && updateDto.employeeNumber !== profile.employeeNumber) {
      await this.ensureEmployeeNumberUnique(updateDto.employeeNumber, profileId);
    }

    const {
      orgLinks,
      performanceSnapshot,
      permissions, // not stored on profile document
      ...profileData
    } = updateDto;

    const normalizedData = this.normalizeDateFields(
      { ...profileData },
      [
        'dateOfHire',
        'contractStartDate',
        'contractEndDate',
        'dateOfBirth',
        'statusEffectiveFrom',
      ],
    );

    const orgLinkPayload = this.buildOrgLinkPayload(orgLinks);
    const performancePayload =
      this.buildPerformanceSnapshotPayload(performanceSnapshot);

    profile.set(
      this.removeUndefined({
        ...normalizedData,
        ...orgLinkPayload,
        ...performancePayload,
      }),
    );

    const updatedProfile = await profile.save();
    return updatedProfile.toObject();
  }

  async updateMyProfile(
    profileId: string,
    updateDto: {
      personalEmail?: string;
      mobilePhone?: string;
      homePhone?: string;
      gender?: string;
      maritalStatus?: string;
    },
  ) {
    const profile = await this.employeeProfileModel.findById(profileId);
    if (!profile) {
      throw new NotFoundException('Employee profile not found.');
    }

    // Only allow updating specific fields
    const allowedFields = {
      personalEmail: updateDto.personalEmail,
      mobilePhone: updateDto.mobilePhone,
      homePhone: updateDto.homePhone,
      gender: updateDto.gender,
      maritalStatus: updateDto.maritalStatus,
    };

    // Remove undefined fields
    const fieldsToUpdate = this.removeUndefined(allowedFields);

    if (Object.keys(fieldsToUpdate).length === 0) {
      throw new BadRequestException('No valid fields to update.');
    }

    profile.set(fieldsToUpdate);
    const updatedProfile = await profile.save();
    return updatedProfile.toObject();
  }

  private async ensureUniqueIdentifiers(
    createDto: CreateEmployeeProfileDto,
  ): Promise<void> {
    const existingProfile = await this.employeeProfileModel.exists({
      $or: [
        { employeeNumber: createDto.employeeNumber },
        { nationalId: createDto.nationalId },
      ],
    });

    if (existingProfile) {
      throw new ConflictException(
        'Employee profile with the provided identifiers already exists.',
      );
    }
  }

  private async ensureEmployeeNumberUnique(
    employeeNumber: string,
    currentProfileId: string,
  ): Promise<void> {
    const existing = await this.employeeProfileModel.exists({
      employeeNumber,
      _id: { $ne: currentProfileId },
    });

    if (existing) {
      throw new ConflictException(
        'Another employee profile already uses this employee number.',
      );
    }
  }

  async listProfiles(filterDto: EmployeeProfileFilterDto) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      departmentIds,
      positionIds,
      payGradeIds,
      workType,
      contractType,
      dateOfHireRange,
      search,
    } = filterDto;

    const query: FilterQuery<EmployeeProfileDocument> = {};

    if (status) {
      query.status = status;
    }
    if (departmentIds?.length) {
      query.primaryDepartmentId = { $in: departmentIds };
    }
    if (positionIds?.length) {
      query.primaryPositionId = { $in: positionIds };
    }
    if (payGradeIds?.length) {
      query.payGradeId = { $in: payGradeIds };
    }
    if (workType) {
      query.workType = workType;
    }
    if (contractType) {
      query.contractType = contractType;
    }
    if (dateOfHireRange?.from || dateOfHireRange?.to) {
      query.dateOfHire = {};
      if (dateOfHireRange.from) {
        query.dateOfHire.$gte = new Date(dateOfHireRange.from);
      }
      if (dateOfHireRange.to) {
        query.dateOfHire.$lte = new Date(dateOfHireRange.to);
      }
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { firstName: regex },
        { lastName: regex },
        { employeeNumber: regex },
        { nationalId: regex },
      ];
    }

    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * safeLimit;
    const sortDirection: SortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
    const sortConfig: Record<string, SortOrder> = { [sortBy]: sortDirection };

    const [data, total] = await Promise.all([
      this.employeeProfileModel
        .find(query)
        .populate('primaryDepartmentId', 'name')
        .populate('primaryPositionId', 'name')
        .populate('supervisorPositionId', 'name')
        .sort(sortConfig)
        .skip(skip)
        .limit(safeLimit)
        .lean()
        .exec(),
      this.employeeProfileModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / safeLimit) || 1;

    return {
      data,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
      },
    };
  }

  async updateEmploymentState(
    profileId: string,
    employmentDto: UpdateEmploymentStateDto,
  ) {
    const profile = await this.employeeProfileModel.findById(profileId);
    if (!profile) {
      throw new NotFoundException('Employee profile not found.');
    }

    const employmentData = this.removeUndefined({
      status: employmentDto.status,
      statusEffectiveFrom: employmentDto.statusEffectiveFrom,
      contractType: employmentDto.contractType,
      workType: employmentDto.workType,
      contractStartDate: employmentDto.contractStartDate,
      contractEndDate: employmentDto.contractEndDate,
      biography: employmentDto.biography,
    });

    const normalizedEmploymentData = this.normalizeDateFields(
      { ...employmentData },
      ['statusEffectiveFrom', 'contractStartDate', 'contractEndDate'],
    );

    if (employmentDto.status && !employmentDto.statusEffectiveFrom) {
      normalizedEmploymentData.statusEffectiveFrom = new Date();
    }

    profile.set(normalizedEmploymentData);
    const updatedProfile = await profile.save();

    // employmentDto.reason / updatedBy can be used for audit logs in event handlers

    return updatedProfile.toObject();
  }

  async assignSupervisor(assignDto: AssignSupervisorDto) {
    const profile = await this.employeeProfileModel.findById(
      assignDto.employeeProfileId,
    );

    if (!profile) {
      throw new NotFoundException('Employee profile not found.');
    }

    profile.supervisorPositionId = assignDto.supervisorPositionId as any;

    if (assignDto.effectiveDate) {
      profile.statusEffectiveFrom = new Date(assignDto.effectiveDate);
    }

    const updatedProfile = await profile.save();
    return updatedProfile.toObject();
  }

  async listCandidates(filterDto: CandidateFilterDto) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        status,
        departmentIds,
        positionIds,
        search,
      } = filterDto;

      const query: FilterQuery<CandidateDocument> = {};

      if (status) {
        query.status = status;
      }
      if (departmentIds?.length) {
        // Handle both array and single value
        const deptIds = Array.isArray(departmentIds) ? departmentIds : [departmentIds];
        query.departmentId = { $in: deptIds };
      }
      if (positionIds?.length) {
        // Handle both array and single value
        const posIds = Array.isArray(positionIds) ? positionIds : [positionIds];
        query.positionId = { $in: posIds };
      }
      if (search) {
        const regex = new RegExp(search, 'i');
        query.$or = [
          { firstName: regex },
          { lastName: regex },
          { candidateNumber: regex },
          { nationalId: regex },
          { personalEmail: regex },
        ];
      }

      const safeLimit = Math.min(Math.max(limit, 1), 100);
      const safePage = Math.max(page, 1);
      const skip = (safePage - 1) * safeLimit;
      const sortDirection: SortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
      const sortConfig: Record<string, SortOrder> = { [sortBy]: sortDirection };

      const [data, total] = await Promise.all([
        this.candidateModel
          .find(query)
          .populate('departmentId', 'name code')
          .populate('positionId', 'title name code')
          .sort(sortConfig)
          .skip(skip)
          .limit(safeLimit)
          .lean()
          .exec(),
        this.candidateModel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / safeLimit) || 1;

      return {
        data,
        meta: {
          page: safePage,
          limit: safeLimit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error in listCandidates:', error);
      throw new BadRequestException(
        `Failed to list candidates: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async createCandidate(createDto: CreateCandidateDto) {
    await this.ensureCandidateUnique(createDto);

    const normalizedPayload = this.normalizeDateFields(
      { ...createDto },
      ['applicationDate', 'dateOfBirth'],
    );

    const createdCandidate = await this.candidateModel.create(
      this.removeUndefined(normalizedPayload),
    );

    return createdCandidate.toObject();
  }

  async getCandidateById(candidateId: string) {
    const candidate = await this.candidateModel.findById(candidateId)
      .populate('departmentId', 'name code')
      .populate('positionId', 'title name code')
      .lean()
      .exec();

    if (!candidate) {
      throw new NotFoundException('Candidate not found.');
    }

    return candidate;
  }

  async getCandidateByEmail(email: string) {
    const candidate = await this.candidateModel.findOne({ personalEmail: email })
      .populate('departmentId', 'name code')
      .populate('positionId', 'title name code')
      .lean()
      .exec();

    if (!candidate) {
      throw new NotFoundException('Candidate not found with this email.');
    }

    return candidate;
  }

  async getCandidateByNationalId(nationalId: string) {
    const candidate = await this.candidateModel.findOne({ nationalId })
      .populate('departmentId', 'name code')
      .populate('positionId', 'title name code')
      .lean()
      .exec();

    if (!candidate) {
      throw new NotFoundException('Candidate not found with this national ID.');
    }

    return candidate;
  }

  async getCandidateByEmployeeProfileId(employeeProfileId: string) {
    // Get the employee profile
    const employeeProfile = await this.employeeProfileModel.findById(employeeProfileId).lean().exec();

    if (!employeeProfile) {
      throw new NotFoundException('Employee profile not found.');
    }

    // Try to find candidate by personalEmail first
    let candidate: any = null;
    if (employeeProfile.personalEmail) {
      candidate = await this.candidateModel.findOne({ personalEmail: employeeProfile.personalEmail })
        .populate('departmentId', 'name code')
        .populate('positionId', 'title name code')
        .lean()
        .exec();
    }

    // If not found by email, try by nationalId
    if (!candidate && employeeProfile.nationalId) {
      candidate = await this.candidateModel.findOne({ nationalId: employeeProfile.nationalId })
        .populate('departmentId', 'name code')
        .populate('positionId', 'title name code')
        .lean()
        .exec();
    }

    // If candidate not found, check if user has Job Candidate role and auto-create candidate profile
    if (!candidate) {
      // Check if employee has Job Candidate role by querying EmployeeSystemRole collection
      // Try both ObjectId and string formats
      const employeeProfileIdObj = employeeProfileId as any;
      const employeeProfileIdStr = String(employeeProfileId);

      const systemRole = await this.systemRoleModel.findOne({
        $or: [
          { employeeProfileId: employeeProfileIdObj },
          { employeeProfileId: employeeProfileIdStr },
        ],
        isActive: true,
      }).exec();

      if (systemRole && systemRole.roles && Array.isArray(systemRole.roles)) {
        const hasJobCandidateRole = systemRole.roles.includes(SystemRole.JOB_CANDIDATE);

        if (hasJobCandidateRole) {
          // Auto-create candidate profile from employee profile
          // Generate unique candidate number
          let candidateNumber = `CAND-${employeeProfile.employeeNumber || Date.now()}`;
          let candidateExists = await this.candidateModel.findOne({ candidateNumber }).exec();
          let counter = 1;
          while (candidateExists) {
            candidateNumber = `CAND-${employeeProfile.employeeNumber || Date.now()}-${counter}`;
            candidateExists = await this.candidateModel.findOne({ candidateNumber }).exec();
            counter++;
          }

          const candidateData: any = {
            candidateNumber,
            firstName: employeeProfile.firstName,
            middleName: employeeProfile.middleName,
            lastName: employeeProfile.lastName,
            fullName: employeeProfile.fullName,
            nationalId: employeeProfile.nationalId,
            personalEmail: employeeProfile.personalEmail,
            mobilePhone: employeeProfile.mobilePhone,
            homePhone: employeeProfile.homePhone,
            profilePictureUrl: employeeProfile.profilePictureUrl,
            address: employeeProfile.address,
            gender: employeeProfile.gender,
            maritalStatus: employeeProfile.maritalStatus,
            dateOfBirth: employeeProfile.dateOfBirth,
            status: CandidateStatus.APPLIED,
            accessProfileId: employeeProfile.accessProfileId,
          };

          // Only include fields that are defined
          Object.keys(candidateData).forEach(key => {
            if (candidateData[key] === undefined) {
              delete candidateData[key];
            }
          });

          const newCandidate = await this.candidateModel.create(candidateData);
          candidate = await this.candidateModel.findById(newCandidate._id)
            .populate('departmentId', 'name code')
            .populate('positionId', 'title name code')
            .lean()
            .exec();
        }
      }
    }

    if (!candidate) {
      throw new NotFoundException('Candidate profile not found for this employee profile.');
    }

    return candidate;
  }

  async updateCandidate(candidateId: string, updateDto: UpdateCandidateDto) {
    const candidate = await this.candidateModel.findById(candidateId);
    if (!candidate) {
      throw new NotFoundException('Candidate not found.');
    }

    await this.ensureCandidateIdentifiersUnique(updateDto, candidateId);

    const normalizedPayload = this.normalizeDateFields(
      { ...updateDto },
      ['applicationDate', 'dateOfBirth'],
    );

    candidate.set(this.removeUndefined(normalizedPayload));
    const updatedCandidate = await candidate.save();

    return updatedCandidate.toObject();
  }

  async updateCandidateStatus(statusDto: UpdateCandidateStatusDto) {
    const candidate = await this.candidateModel.findById(statusDto.candidateId);

    if (!candidate) {
      throw new NotFoundException('Candidate not found.');
    }

    candidate.status = statusDto.status;
    if (statusDto.notes) {
      candidate.notes = statusDto.notes;
    }

    const updatedCandidate = await candidate.save();

    // statusDto.updatedBy can be used to log activity externally

    return updatedCandidate.toObject();
  }

  async convertCandidate(convertDto: ConvertCandidateDto) {
    // Validate required fields
    if (!convertDto.employeeNumber || !convertDto.dateOfHire) {
      throw new BadRequestException(
        'employeeNumber and dateOfHire are required fields.',
      );
    }

    const candidate = await this.candidateModel.findById(convertDto.candidateId);
    if (!candidate) {
      throw new NotFoundException('Candidate not found.');
    }

    if (candidate.status === CandidateStatus.HIRED) {
      throw new ConflictException('Candidate was already converted to employee.');
    }

    const createPayload: CreateEmployeeProfileDto = {
      employeeNumber: convertDto.employeeNumber,
      dateOfHire: convertDto.dateOfHire,
      firstName: candidate.firstName,
      middleName: candidate.middleName ?? undefined,
      lastName: candidate.lastName,
      fullName: candidate.fullName ?? undefined,
      nationalId: candidate.nationalId,
      personalEmail: candidate.personalEmail ?? undefined,
      mobilePhone: candidate.mobilePhone ?? undefined,
      homePhone: candidate.homePhone ?? undefined,
      profilePictureUrl: candidate.profilePictureUrl ?? undefined,
      address: candidate.address ? (candidate.address as any) : undefined,
      gender: candidate.gender ?? undefined,
      maritalStatus: candidate.maritalStatus ?? undefined,
      dateOfBirth: candidate.dateOfBirth
        ? candidate.dateOfBirth.toISOString()
        : undefined,
      workEmail: undefined,
      status: EmployeeStatus.ACTIVE,
      orgLinks: this.removeUndefined({
        primaryPositionId: convertDto.positionId,
        primaryDepartmentId: convertDto.departmentId,
        payGradeId: convertDto.payGradeId,
      }),
    };

    const profile = await this.createProfile(createPayload);

    candidate.status = CandidateStatus.HIRED;
    await candidate.save();

    return profile;
  }

  async addQualification(createDto: CreateEmployeeQualificationDto) {
    // Validate required fields
    if (!createDto.establishmentName || !createDto.graduationType) {
      throw new BadRequestException(
        'establishmentName and graduationType are required fields.',
      );
    }

    await this.ensureProfileExists(createDto.employeeProfileId);

    const qualification = await this.qualificationModel.create(createDto);
    return qualification.toObject();
  }

  async updateQualification(
    qualificationId: string,
    updateDto: UpdateEmployeeQualificationDto,
  ) {
    const qualification = await this.qualificationModel.findById(
      qualificationId,
    );

    if (!qualification) {
      throw new NotFoundException('Qualification not found.');
    }

    if (updateDto.employeeProfileId) {
      await this.ensureProfileExists(updateDto.employeeProfileId);
    }

    qualification.set(this.removeUndefined({ ...updateDto }));
    const updatedQualification = await qualification.save();

    return updatedQualification.toObject();
  }

  async listQualifications(profileId: string) {
    await this.ensureProfileExists(profileId);

    const qualifications = await this.qualificationModel
      .find({ employeeProfileId: profileId })
      .lean()
      .exec();

    return qualifications;
  }

  async assignSystemRoles(assignDto: CreateEmployeeSystemRoleDto) {
    await this.ensureProfileExists(assignDto.employeeProfileId);

    console.log('assignSystemRoles - Input:', {
      employeeProfileId: assignDto.employeeProfileId,
      roles: assignDto.roles,
      permissions: assignDto.permissions,
      isActive: assignDto.isActive,
    });

    // First, try to find an active role
    let existing = await this.systemRoleModel.findOne({
      employeeProfileId: assignDto.employeeProfileId,
      isActive: true,
    });

    // If no active role, check for any role (including inactive)
    if (!existing) {
      existing = await this.systemRoleModel.findOne({
        employeeProfileId: assignDto.employeeProfileId,
      });
    }

    // Validate and normalize roles
    const validRoles = Object.values(SystemRole);
    let normalizedRoles: SystemRole[] = [];

    if (assignDto.roles !== undefined && assignDto.roles !== null) {
      if (Array.isArray(assignDto.roles)) {
        normalizedRoles = assignDto.roles
          .map(role => {
            const roleStr = String(role).trim();
            // Check exact match first
            if (validRoles.includes(roleStr as SystemRole)) {
              return roleStr as SystemRole;
            }
            // Try case-insensitive match
            const matched = validRoles.find(
              validRole => validRole.toLowerCase() === roleStr.toLowerCase()
            );
            if (matched) {
              console.log(`assignSystemRoles - Normalized role "${roleStr}" to "${matched}"`);
              return matched;
            }
            console.warn(`assignSystemRoles - Invalid role ignored: "${roleStr}"`);
            return null;
          })
          .filter((role): role is SystemRole => role !== null);
      }
    }

    if (existing) {
      const existingObj = existing.toObject();
      console.log('assignSystemRoles - Found existing role:', {
        _id: existing._id,
        currentRoles: existing.roles,
        currentPermissions: existing.permissions,
        currentIsActive: existing.isActive,
        updatedAt: (existingObj as any).updatedAt,
      });

      // Check if there are other active roles for this employee (shouldn't happen, but handle it)
      const otherActiveRoles = await this.systemRoleModel.find({
        employeeProfileId: assignDto.employeeProfileId,
        isActive: true,
        _id: { $ne: existing._id }, // Exclude the current one
      });

      if (otherActiveRoles.length > 0) {
        console.warn(`assignSystemRoles - Found ${otherActiveRoles.length} other active roles! Deactivating them...`);
        // Deactivate all other active roles to ensure only one is active
        await this.systemRoleModel.updateMany(
          {
            employeeProfileId: assignDto.employeeProfileId,
            isActive: true,
            _id: { $ne: existing._id },
          },
          { isActive: false }
        );
      }

      // Update existing role
      const updateData: any = {};

      // If roles are provided, replace them completely (don't merge)
      if (assignDto.roles !== undefined && assignDto.roles !== null) {
        updateData.roles = normalizedRoles.length > 0 ? normalizedRoles : [];
        console.log('assignSystemRoles - Replacing roles with:', updateData.roles);
      }

      // If permissions are provided, replace them completely (don't merge)
      if (assignDto.permissions !== undefined && assignDto.permissions !== null) {
        updateData.permissions = Array.isArray(assignDto.permissions) ? assignDto.permissions : [];
      }

      // Always set isActive if provided, otherwise keep existing or default to true
      updateData.isActive = assignDto.isActive !== undefined ? assignDto.isActive : (existing.isActive ?? true);

      existing.set(this.removeUndefined(updateData));
      const updated = await existing.save();

      const updatedObj = updated.toObject();
      console.log('assignSystemRoles - Updated existing role:', {
        employeeProfileId: assignDto.employeeProfileId,
        oldRoles: existing.roles,
        newRoles: updated.roles,
        permissions: updated.permissions,
        isActive: updated.isActive,
        updatedAt: (updatedObj as any).updatedAt,
      });

      return updated.toObject();
    }

    // Before creating new role, ensure no other active roles exist
    const otherActiveRoles = await this.systemRoleModel.find({
      employeeProfileId: assignDto.employeeProfileId,
      isActive: true,
    });

    if (otherActiveRoles.length > 0) {
      console.warn(`assignSystemRoles - Found ${otherActiveRoles.length} active roles when creating new one! Deactivating them...`);
      // Deactivate all existing active roles
      await this.systemRoleModel.updateMany(
        {
          employeeProfileId: assignDto.employeeProfileId,
          isActive: true,
        },
        { isActive: false }
      );
    }

    // Create new role if none exists
    const roleData = {
      employeeProfileId: assignDto.employeeProfileId,
      roles: normalizedRoles.length > 0 ? normalizedRoles : (assignDto.roles || []),
      permissions: assignDto.permissions || [],
      isActive: assignDto.isActive !== undefined ? assignDto.isActive : true,
    };

    const created = await this.systemRoleModel.create(roleData);

    const createdObj = created.toObject();
    console.log('assignSystemRoles - Created new role:', {
      employeeProfileId: assignDto.employeeProfileId,
      roles: created.roles,
      permissions: created.permissions,
      isActive: created.isActive,
      createdAt: (createdObj as any).createdAt,
    });

    return created.toObject();
  }

  async updatePermissions(
    profileId: string,
    permissions: string[],
  ): Promise<EmployeeSystemRole> {
    await this.ensureProfileExists(profileId);

    const roles = await this.systemRoleModel.findOne({
      employeeProfileId: profileId,
    });

    if (!roles) {
      // Create system role configuration if it doesn't exist
      const created = await this.systemRoleModel.create({
        employeeProfileId: profileId,
        roles: [],
        permissions: permissions || [],
        isActive: true,
      });
      return created.toObject();
    }

    roles.permissions = permissions;
    const updated = await roles.save();

    return updated.toObject();
  }

  async createProfileChangeRequest(
    createDto: CreateEmployeeProfileChangeRequestDto,
  ) {
    // Validate required fields
    if (!createDto.requestId || !createDto.requestDescription) {
      throw new BadRequestException(
        'requestId and requestDescription are required fields.',
      );
    }

    await this.ensureProfileExists(createDto.employeeProfileId);

    const exists = await this.changeRequestModel.exists({
      requestId: createDto.requestId,
    });
    if (exists) {
      throw new ConflictException(
        'A change request with this ID already exists.',
      );
    }

    const payload = this.normalizeDateFields(
      { ...createDto },
      ['submittedAt', 'processedAt'],
    );

    const request = await this.changeRequestModel.create(
      this.removeUndefined(payload),
    );
    return request.toObject();
  }

  async getPendingChangeRequests(filterDto?: {
    status?: string;
    employeeProfileId?: string;
  }) {
    const query: FilterQuery<EmployeeProfileChangeRequest> = {};

    if (filterDto?.status) {
      query.status = filterDto.status;
    }
    if (filterDto?.employeeProfileId) {
      query.employeeProfileId = filterDto.employeeProfileId;
    }

    const requests = await this.changeRequestModel
      .find(query)
      .sort({ submittedAt: -1 })
      .lean()
      .exec();

    return requests;
  }

  async processChangeRequest(
    updateDto: UpdateEmployeeProfileChangeRequestDto,
  ) {
    const request = await this.changeRequestModel.findOne({
      requestId: updateDto.requestId,
    });

    if (!request) {
      throw new NotFoundException('Change request not found.');
    }

    request.set(
      this.removeUndefined({
        status: updateDto.status,
        processedAt: updateDto.processedAt
          ? new Date(updateDto.processedAt)
          : new Date(),
        requestDescription: updateDto.requestDescription,
        reason: updateDto.reason,
      }),
    );

    const updated = await request.save();
    return updated.toObject();
  }

  async archiveProfile(profileId: string, reason?: string) {
    const profile = await this.employeeProfileModel.findById(profileId);
    if (!profile) {
      throw new NotFoundException('Employee profile not found.');
    }

    profile.status = EmployeeStatus.INACTIVE;
    profile.statusEffectiveFrom = new Date();

    if (reason) {
      profile.biography = profile.biography
        ? `${profile.biography}\n\nArchived Reason: ${reason}`
        : `Archived Reason: ${reason}`;
    }

    const updatedProfile = await profile.save();
    return updatedProfile.toObject();
  }

  async reactivateProfile(profileId: string, reason?: string) {
    const profile = await this.employeeProfileModel.findById(profileId);
    if (!profile) {
      throw new NotFoundException('Employee profile not found.');
    }

    // Check if already active
    if (profile.status === EmployeeStatus.ACTIVE) {
      return profile.toObject();
    }

    profile.status = EmployeeStatus.ACTIVE;
    profile.statusEffectiveFrom = new Date();

    if (reason) {
      profile.biography = profile.biography
        ? `${profile.biography}\n\nReactivated Reason: ${reason}`
        : `Reactivated Reason: ${reason}`;
    }

    const updatedProfile = await profile.save();
    return updatedProfile.toObject();
  }

  async deactivateAccess(profileId: string) {
    await this.ensureProfileExists(profileId);

    let roles = await this.systemRoleModel.findOne({
      employeeProfileId: profileId,
    });

    if (!roles) {
      // Create system role configuration if it doesn't exist, then deactivate it
      roles = await this.systemRoleModel.create({
        employeeProfileId: profileId,
        roles: [],
        permissions: [],
        isActive: false,
      });
    } else {
      roles.isActive = false;
      await roles.save();
    }

    await this.employeeProfileModel.updateOne(
      { _id: profileId },
      { $unset: { accessProfileId: 1 } },
    );

    return roles.toObject();
  }

  async reactivateAccess(profileId: string) {
    await this.ensureProfileExists(profileId);

    let roles = await this.systemRoleModel.findOne({
      employeeProfileId: profileId,
    });

    if (!roles) {
      // Create system role configuration if it doesn't exist, then activate it
      roles = await this.systemRoleModel.create({
        employeeProfileId: profileId,
        roles: [],
        permissions: [],
        isActive: true,
      });
    } else {
      roles.isActive = true;
      await roles.save();
    }

    return roles.toObject();
  }

  private async ensureCandidateUnique(
    createDto: CreateCandidateDto,
  ): Promise<void> {
    const existing = await this.candidateModel.exists({
      $or: [
        { candidateNumber: createDto.candidateNumber },
        { nationalId: createDto.nationalId },
      ],
    });

    if (existing) {
      throw new ConflictException(
        'Candidate with the provided identifiers already exists.',
      );
    }
  }

  private async ensureCandidateIdentifiersUnique(
    updateDto: UpdateCandidateDto,
    candidateId: string,
  ) {
    const uniqueFilters: FilterQuery<CandidateDocument>[] = [];
    if (updateDto.candidateNumber) {
      uniqueFilters.push({ candidateNumber: updateDto.candidateNumber });
    }
    if (updateDto.nationalId) {
      uniqueFilters.push({ nationalId: updateDto.nationalId });
    }

    if (!uniqueFilters.length) {
      return;
    }

    const existing = await this.candidateModel.exists({
      _id: { $ne: candidateId },
      $or: uniqueFilters,
    });

    if (existing) {
      throw new ConflictException(
        'Another candidate already uses the provided identifier values.',
      );
    }
  }

  async getProfileById(
    profileId: string,
    options?: { populate?: string[]; userRoles?: string[] },
  ) {
    const query = this.employeeProfileModel.findById(profileId);

    const populateTargets = this.normalizePopulateTargets(options?.populate);
    populateTargets.forEach((path) => query.populate(path));

    const profile = await query.exec();
    if (!profile) {
      throw new NotFoundException('Employee profile not found.');
    }

    const profileObject = profile.toObject();

    // Filter fields based on user role
    const userRoles = options?.userRoles || [];
    if (userRoles.includes('Finance Staff')) {
      return this.filterFinanceFields(profileObject);
    }
    if (userRoles.includes('Legal & Policy Admin')) {
      return this.filterComplianceFields(profileObject);
    }

    return profileObject;
  }

  private filterFinanceFields(profile: any): any {
    // Finance Staff can only see finance-related fields
    const financeFields = [
      '_id',
      'employeeNumber',
      'status',
      'statusEffectiveFrom',
      'dateOfHire',
      'contractType',
      'contractStartDate',
      'contractEndDate',
      'bankName',
      'bankAccountNumber',
      'primaryPositionId',
      'primaryDepartmentId',
      'payGradeId',
      'createdAt',
      'updatedAt',
    ];

    const filtered: any = {};
    financeFields.forEach((field) => {
      if (profile[field] !== undefined) {
        filtered[field] = profile[field];
      }
    });

    return filtered;
  }

  private filterComplianceFields(profile: any): any {
    // Legal & Policy Admin can only see compliance-related fields
    const complianceFields = [
      '_id',
      'employeeNumber',
      'firstName',
      'middleName',
      'lastName',
      'fullName',
      'nationalId',
      'status',
      'statusEffectiveFrom',
      'workEmail',
      'dateOfHire',
      'contractType',
      'workType',
      'contractStartDate',
      'contractEndDate',
      'primaryPositionId',
      'primaryDepartmentId',
      'createdAt',
      'updatedAt',
    ];

    const filtered: any = {};
    complianceFields.forEach((field) => {
      if (profile[field] !== undefined) {
        filtered[field] = profile[field];
      }
    });

    return filtered;
  }

  private normalizePopulateTargets(targets?: string[]): string[] {
    if (!targets || !targets.length) {
      return [];
    }

    return targets.filter((target) =>
      this.allowedPopulatePaths.includes(target as (typeof this.allowedPopulatePaths)[number]),
    );
  }

  private buildOrgLinkPayload(
    orgLinks: CreateEmployeeProfileDto['orgLinks'],
  ): Record<string, unknown> {
    if (!orgLinks) {
      return {};
    }

    return this.removeUndefined({
      primaryDepartmentId: orgLinks.primaryDepartmentId,
      primaryPositionId: orgLinks.primaryPositionId,
      supervisorPositionId: orgLinks.supervisorPositionId,
      payGradeId: orgLinks.payGradeId,
    });
  }

  private buildPerformanceSnapshotPayload(
    snapshot: CreateEmployeeProfileDto['performanceSnapshot'],
  ): Record<string, unknown> {
    if (!snapshot) {
      return {};
    }

    const normalizedSnapshot = this.normalizeDateFields(
      { ...snapshot },
      ['lastAppraisalDate'],
    );

    return this.removeUndefined(normalizedSnapshot);
  }

  private normalizeDateFields(
    payload: Record<string, any>,
    keys: string[],
  ): Record<string, any> {
    keys.forEach((key) => {
      const value = payload[key];
      if (value) {
        payload[key] = new Date(value);
      }
    });

    return payload;
  }

  private removeUndefined<T extends Record<string, unknown>>(payload: T): T {
    const sanitized = Object.entries(payload).reduce<Record<string, unknown>>(
      (acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      },
      {},
    );

    return sanitized as T;
  }

  private async ensureProfileExists(profileId: string): Promise<void> {
    const exists = await this.employeeProfileModel.exists({ _id: profileId });
    if (!exists) {
      throw new NotFoundException('Employee profile not found.');
    }
  }
}
