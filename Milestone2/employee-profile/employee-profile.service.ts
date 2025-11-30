import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, SortOrder } from 'mongoose';
import {
  EmployeeProfile,
  EmployeeProfileDocument,
} from './models/employee-profile.schema';
import { Candidate, CandidateDocument } from './models/candidate.schema';
import { EmployeeQualification } from './models/qualification.schema';
import { CreateEmployeeProfileDto } from './dto/create-employee-profile.dto';
import { UpdateEmployeeProfileDto } from './dto/update-employee-profile.dto';
import { EmployeeProfileFilterDto } from './dto/employee-profile-filter.dto';
import { UpdateEmploymentStateDto } from './dto/update-employment-state.dto';
import { AssignSupervisorDto } from './dto/assign-supervisor.dto';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { UpdateCandidateStatusDto } from './dto/update-candidate-status.dto';
import { ConvertCandidateDto } from './dto/convert-candidate.dto';
import {
  CandidateStatus,
  EmployeeStatus,
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
  ) {}

  async createProfile(createDto: CreateEmployeeProfileDto) {
    await this.ensureUniqueIdentifiers(createDto);

    const {
      orgLinks,
      performanceSnapshot,
      permissions, // handled by access control flows, not stored on profile document
      ...profileData
    } = createDto;

    const basePayload = this.normalizeDateFields(
      {
        ...profileData,
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

    const existing = await this.systemRoleModel.findOne({
      employeeProfileId: assignDto.employeeProfileId,
    });

    if (existing) {
      existing.set(
        this.removeUndefined({
          roles: assignDto.roles ?? existing.roles,
          permissions: assignDto.permissions ?? existing.permissions,
          isActive:
            assignDto.isActive === undefined ? existing.isActive : assignDto.isActive,
        }),
      );

      const updated = await existing.save();
      return updated.toObject();
    }

    const created = await this.systemRoleModel.create(assignDto);
    return created.toObject();
  }

  async updatePermissions(
    profileId: string,
    permissions: string[],
  ): Promise<EmployeeSystemRole> {
    const roles = await this.systemRoleModel.findOne({
      employeeProfileId: profileId,
    });

    if (!roles) {
      throw new NotFoundException('System role configuration not found.');
    }

    roles.permissions = permissions;
    const updated = await roles.save();

    return updated.toObject();
  }

  async createProfileChangeRequest(
    createDto: CreateEmployeeProfileChangeRequestDto,
  ) {
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

  async deactivateAccess(profileId: string) {
    await this.ensureProfileExists(profileId);

    const roles = await this.systemRoleModel.findOne({
      employeeProfileId: profileId,
    });

    // If system role exists, deactivate it
    if (roles) {
      roles.isActive = false;
      await roles.save();
    }

    // Always remove accessProfileId from employee profile
    await this.employeeProfileModel.updateOne(
      { _id: profileId },
      { $unset: { accessProfileId: 1 } },
    );

    // Return success response
    return {
      message: 'Access deactivated successfully',
      profileId,
      systemRoleDeactivated: !!roles,
    };
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
    options?: { populate?: string[] },
  ) {
    const query = this.employeeProfileModel.findById(profileId);

    const populateTargets = this.normalizePopulateTargets(options?.populate);
    populateTargets.forEach((path) => query.populate(path));

    const profile = await query.exec();
    if (!profile) {
      throw new NotFoundException('Employee profile not found.');
    }

    return profile.toObject();
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
