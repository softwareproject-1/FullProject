import { Test, TestingModule } from '@nestjs/testing';
import { LeavesService } from './leaves.service';
// Omar's work - Original imports
// Seif's work - Additional test imports
import { getModelToken } from '@nestjs/mongoose';
import { LeaveType } from './schemas/leave-type.schema';
import { LeaveRequest } from './schemas/leave-request.schema';
import { LeavePolicy } from './schemas/leave-policy.schema';
import { LeaveEntitlement } from './schemas/leave-entitlement.schema';
import { Calendar } from './schemas/calendar.schema';
import { Attachment } from './schemas/attachment.schema';
import { EmployeeProfileService } from '../employee-profile/employee-profile.service';
import { TimeManagementService } from '../time-management/time-management.service';
import { PayrollExecutionService } from '../payroll-execution/payroll-execution.service';
import { Position } from '../organization-structure/models/position.schema';
import { Department } from '../organization-structure/models/department.schema';
import { AttendanceRecord } from '../time-management/models/attendance-record.schema';
import { EmployeeProfile } from '../employee-profile/models/employee-profile.schema';
import { employeePenalties } from '../payroll-execution/models/employeePenalties.schema';
import { payGrade } from '../payroll-configuration/models/payGrades.schema';
import { PositionAssignment } from '../organization-structure/models/position-assignment.schema';
import { LeaveStatus } from './enums/leave-status.enum';
import { Types } from 'mongoose';
import { BadRequestException } from '@nestjs/common';

describe('LeavesService', () => {
  let service: LeavesService;

  // Omar's work - Original test setup
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeavesService],
    }).compile();

    service = module.get<LeavesService>(LeavesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

// ============================ Seif's work: Phase 2 Tests ============================
describe('LeavesService Phase 2 Tests', () => {
  let service: LeavesService;

  // Mocks
  const mockLeaveRequestModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    countDocuments: jest.fn(),
  };

  // Constructor for new model instances
  class MockLeaveRequestModel {
    constructor(public data: any) { Object.assign(this, data); }
    save = jest.fn().mockResolvedValue(this);
  }

  const mockLeaveTypeModel = {
    findById: jest.fn(),
    findOne: jest.fn(),
  };

  const mockLeaveEntitlementModel = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockLeavePolicyModel = {
    findOne: jest.fn(),
  };

  const mockEmployeeProfileService = {
    getEmployeeDetails: jest.fn(),
    getDepartmentMembers: jest.fn(),
  };

  const mockTimeManagementService = {
    createTimeException: jest.fn(),
    createAttendanceRecord: jest.fn(),
    createNotification: jest.fn(),
  };

  const mockPayrollExecutionService = {};

  const mockEmployeePenaltiesModel = {
    findOneAndUpdate: jest.fn(),
  };

  const mockPositionAssignmentModel = {
    findOne: jest.fn(),
  };

  const mockAttachmentModel = {
    findById: jest.fn(),
  };

  const mockCalendarModel = {
    findOne: jest.fn(),
  };

  const mockPositionModel = { findById: jest.fn() };
  const mockDepartmentModel = { findById: jest.fn() };
  const mockAttendanceRecordModel = { findOne: jest.fn() };
  const mockEmployeeModel = { findOne: jest.fn() };
  const mockPayGradeModel = { findById: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeavesService,
        { provide: getModelToken(LeaveRequest.name), useValue: MockLeaveRequestModel }, // Use class for constructor
        { provide: getModelToken(LeaveType.name), useValue: mockLeaveTypeModel },
        { provide: getModelToken(LeaveEntitlement.name), useValue: mockLeaveEntitlementModel },
        { provide: getModelToken(LeavePolicy.name), useValue: mockLeavePolicyModel },
        { provide: getModelToken(Calendar.name), useValue: mockCalendarModel },
        { provide: getModelToken(Attachment.name), useValue: mockAttachmentModel },
        { provide: getModelToken(PositionAssignment.name), useValue: mockPositionAssignmentModel },
        { provide: getModelToken(employeePenalties.name), useValue: mockEmployeePenaltiesModel },
        { provide: getModelToken(payGrade.name), useValue: mockPayGradeModel },
        { provide: getModelToken(Position.name), useValue: mockPositionModel },
        { provide: getModelToken(Department.name), useValue: mockDepartmentModel },
        { provide: getModelToken(AttendanceRecord.name), useValue: mockAttendanceRecordModel },
        { provide: getModelToken(EmployeeProfile.name), useValue: mockEmployeeModel },
        { provide: EmployeeProfileService, useValue: mockEmployeeProfileService },
        { provide: TimeManagementService, useValue: mockTimeManagementService },
        { provide: PayrollExecutionService, useValue: mockPayrollExecutionService },
        // Add missing models if any
        { provide: getModelToken('LeaveCategory'), useValue: {} },
        { provide: getModelToken('LeaveAdjustment'), useValue: {} },
      ],
    }).compile();

    service = module.get<LeavesService>(LeavesService);

    // Fix for the constructor injection of LeaveRequestModel which is used as 'new this.leaveRequestModel(...)'
    // We need to ensure the injected value behaves like a constructor but also has static methods
    const leaveRequestModel = module.get(getModelToken(LeaveRequest.name));
    leaveRequestModel.find = mockLeaveRequestModel.find;
    leaveRequestModel.findOne = mockLeaveRequestModel.findOne;
    leaveRequestModel.countDocuments = mockLeaveRequestModel.countDocuments;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Phase 2: Leave Submission & Validation', () => {
    it('REQ-015: Should submit a valid leave request', async () => {
      const employeeId = new Types.ObjectId().toString();
      const leaveTypeId = new Types.ObjectId().toString();
      const dates = { from: new Date('2025-06-01'), to: new Date('2025-06-05') }; // 5 days

      // Mocks
      mockLeaveTypeModel.findById.mockResolvedValue({ _id: leaveTypeId, name: 'Annual Leave', requiresAttachment: false });
      mockEmployeeProfileService.getEmployeeDetails.mockResolvedValue({ _id: employeeId, dateOfHire: new Date('2020-01-01') });
      mockCalendarModel.findOne.mockResolvedValue({ holidays: [], blockedPeriods: [] }); // No holidays
      mockLeaveRequestModel.findOne.mockResolvedValue(null); // No overlap
      mockLeaveEntitlementModel.findOne.mockResolvedValue({ taken: 0, yearlyEntitlement: 20 }); // Balance = 20
      mockLeaveRequestModel.find.mockResolvedValue([]); // No taken requests

      // Mock calculateNetLeaveDuration (Phase 1 method)
      // Since it's inside the service, we can spy on it or let it run if dependencies are mocked.
      // The service uses this.calendarModel.findOne, which we mocked.
      // It loops dates. 5 days, no weekends (June 1 2025 is Sunday... wait. Let's pick weekdays)
      // June 2 (Mon) to June 6 (Fri) 2025 is 5 days.
      const validDates = { from: new Date('2025-06-02'), to: new Date('2025-06-06') };

      const result = await service.submitLeaveRequest(employeeId, leaveTypeId, validDates, 'Vacation');

      expect(result).toBeDefined();
      expect(result.status).toBe(LeaveStatus.PENDING);
      expect(result.durationDays).toBe(5);
    });

    it('BR 29: Should split request into Paid and Unpaid if balance is insufficient', async () => {
      const employeeId = new Types.ObjectId().toString();
      const leaveTypeId = new Types.ObjectId().toString();
      const unpaidTypeId = new Types.ObjectId().toString();
      const dates = { from: new Date('2025-06-02'), to: new Date('2025-06-13') }; // 10 weekdays (2 weeks)

      // Mocks
      mockLeaveTypeModel.findById.mockResolvedValue({ _id: leaveTypeId, name: 'Annual Leave' });
      mockLeaveTypeModel.findOne.mockResolvedValue({ _id: unpaidTypeId, code: 'UNPAID' }); // Mock Unpaid type
      mockEmployeeProfileService.getEmployeeDetails.mockResolvedValue({ _id: employeeId, dateOfHire: new Date('2020-01-01') });
      mockCalendarModel.findOne.mockResolvedValue({ holidays: [], blockedPeriods: [] });

      // Balance setup: Only 3 days remaining
      mockLeaveEntitlementModel.findOne.mockResolvedValue({ taken: 17, yearlyEntitlement: 20 });
      mockLeaveRequestModel.find.mockResolvedValue([{ durationDays: 17, status: LeaveStatus.APPROVED }]); // 17 taken

      // Execution
      const result = await service.submitLeaveRequest(employeeId, leaveTypeId, dates, 'Long Vacation');

      // Verification
      // Should return the *Unpaid* request (the last one saved)
      expect(result.leaveTypeId).toEqual(unpaidTypeId);
      // Duration should be 7 (10 total - 3 paid)
      expect(result.durationDays).toBe(7);
      expect(result.justification).toContain('Unpaid portion');
    });

    it('REQ-016: Should reject if attachment is missing when required', async () => {
      const employeeId = new Types.ObjectId().toString();
      const leaveTypeId = new Types.ObjectId().toString();
      const dates = { from: new Date(), to: new Date() };

      mockLeaveTypeModel.findById.mockResolvedValue({
        _id: leaveTypeId,
        name: 'Sick Leave',
        requiresAttachment: true // Enforce attachment
      });

      mockEmployeeProfileService.getEmployeeDetails.mockResolvedValue({ _id: employeeId });

      await expect(service.submitLeaveRequest(employeeId, leaveTypeId, dates, 'Sick', undefined))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('Phase 2: Manager Authorization & Delegation', () => {
    // We need to access the private method verifyManagerAuthorization. 
    // In TS tests, we can cast to any.
    it('REQ-023: Should authorize via Explicit Delegation (PositionAssignment)', async () => {
      const employee = { supervisorPositionId: 'pos-1' };
      const managerId = 'manager-delegate';

      // Mock PositionAssignment finding a record
      mockPositionAssignmentModel.findOne.mockResolvedValue({
        employeeProfileId: managerId,
        positionId: 'pos-1',
        startDate: new Date('2020-01-01'),
        endDate: null // Indefinite
      });

      const isAuthorized = await (service as any).verifyManagerAuthorization(employee, managerId);

      expect(isAuthorized).toBe(true);
    });
  });

  describe('Phase 2: Finalization & Integration', () => {
    it('REQ-042: Should record penalty for Unpaid Leave', async () => {
      const request = {
        employeeId: 'emp-1',
        leaveTypeId: 'type-unpaid',
        dates: { from: new Date(), to: new Date() },
        durationDays: 2,
        justification: 'Unpaid'
      };

      // Mocks
      mockLeaveTypeModel.findById.mockResolvedValue({ code: 'UNPAID', name: 'Unpaid Leave' });
      mockEmployeeProfileService.getEmployeeDetails.mockResolvedValue({ payGradeId: 'pg-1' });
      mockPayGradeModel.findById.mockResolvedValue({ baseSalary: 2200 }); // 100 per day (22 days)

      await (service as any).finalizeLeaveRequest(request as any);

      expect(mockEmployeePenaltiesModel.findOneAndUpdate).toHaveBeenCalledWith(
        { employeeId: 'emp-1' },
        expect.objectContaining({
          $push: expect.objectContaining({
            penalties: expect.objectContaining({
              amount: 200, // 2 days * 100
              type: 'UNPAID_LEAVE'
            })
          })
        }),
        { upsert: true, new: true }
      );
    });

    it('REQ-029: Should create Time Exception and Placeholder Attendance', async () => {
      const request = {
        employeeId: 'emp-1',
        leaveTypeId: 'type-annual',
        dates: { from: new Date('2025-06-01'), to: new Date('2025-06-02') },
        durationDays: 1,
        justification: 'Vacation'
      };

      mockLeaveTypeModel.findById.mockResolvedValue({ code: 'ANNUAL', name: 'Annual' });

      // Mock no existing attendance
      mockAttendanceRecordModel.findOne.mockResolvedValue(null);

      // Mock creation of placeholder
      mockTimeManagementService.createAttendanceRecord.mockResolvedValue({ _id: 'att-1' });

      await (service as any).finalizeLeaveRequest(request as any);

      // Should create placeholder
      expect(mockTimeManagementService.createAttendanceRecord).toHaveBeenCalled();
      // Should create exception
      expect(mockTimeManagementService.createTimeException).toHaveBeenCalledWith(
        expect.objectContaining({
          attendanceRecordId: 'att-1',
          type: 'MANUAL_ADJUSTMENT' // TimeExceptionType.MANUAL_ADJUSTMENT
        })
      );
    });
  });
});
// ============================ End of Seif's work ============================
