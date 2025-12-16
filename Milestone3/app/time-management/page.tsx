'use client'

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { 
  Clock, Calendar, AlertTriangle, Settings, 
  FileText, Users, TrendingUp, Bell
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { hasRole, SystemRole } from '@/utils/roleAccess';

export default function TimeManagement() {
  const { user } = useAuth();
  const router = useRouter();
  const isDepartmentEmployee = user ? hasRole(user.roles, SystemRole.DEPARTMENT_EMPLOYEE) : false;
  const isSystemAdmin = user ? hasRole(user.roles, SystemRole.SYSTEM_ADMIN) : false;
  const isHRAdmin = user ? hasRole(user.roles, SystemRole.HR_ADMIN) : false;
  const isHRManager = user ? hasRole(user.roles, SystemRole.HR_MANAGER) : false;
  const isPayrollSpecialist = user ? hasRole(user.roles, SystemRole.PAYROLL_SPECIALIST) : false;
  
  // HR Employee is treated the same as Department Employee
  const isHREmployee = user ? hasRole(user.roles, SystemRole.HR_EMPLOYEE) : false;
  
  // Other roles that should only see Clock In/Out
  const isDepartmentHead = user ? hasRole(user.roles, SystemRole.DEPARTMENT_HEAD) : false;
  const isPayrollManager = user ? hasRole(user.roles, SystemRole.PAYROLL_MANAGER) : false;
  const isLegalPolicyAdmin = user ? hasRole(user.roles, SystemRole.LEGAL_POLICY_ADMIN) : false;
  const isRecruiter = user ? hasRole(user.roles, SystemRole.RECRUITER) : false;
  const isFinanceStaff = user ? hasRole(user.roles, SystemRole.FINANCE_STAFF) : false;
  const isJobCandidate = user ? hasRole(user.roles, SystemRole.JOB_CANDIDATE) : false;
  
  // Check if user has any of the "other roles" (not configured roles)
  // Job Candidates are excluded - they should see nothing
  const isOtherRole = isDepartmentHead || isPayrollManager || 
                      isLegalPolicyAdmin || isRecruiter || isFinanceStaff;
  
  // Job Candidates should not see anything in time management - redirect them
  useEffect(() => {
    if (isJobCandidate && user) {
      router.replace('/candidate');
    }
  }, [isJobCandidate, user, router]);
  
  // Job Candidates should not see anything in time management
  if (isJobCandidate) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-slate-900 mb-2">Time Management</h1>
          <p className="text-slate-600">You do not have access to this section.</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 text-center">
          <p className="text-slate-500">Access to Time Management is restricted for your role.</p>
        </div>
      </div>
    );
  }

  const allMenuItems = [
    { 
      id: 'shifts', 
      label: 'Shifts', 
      icon: Clock,
      description: 'Manage shift templates and configurations',
      href: '/time-management/shifts'
    },
    { 
      id: 'shift-types', 
      label: 'Shift Types', 
      icon: Settings,
      description: 'Define shift type categories',
      href: '/time-management/shift-types'
    },
    { 
      id: 'schedule-rules', 
      label: 'Schedule Rules', 
      icon: Calendar,
      description: 'Configure scheduling patterns and rules',
      href: '/time-management/schedule-rules'
    },
    { 
      id: 'shift-assignments', 
      label: 'Shift Assignments', 
      icon: Users,
      description: 'Assign shifts to employees individually or in bulk',
      href: '/time-management/shift-assignments'
    },
    { 
      id: 'attendance', 
      label: 'Attendance Records', 
      icon: FileText,
      description: 'View and manage attendance logs',
      href: '/time-management/attendance'
    },
    { 
      id: 'clock-in-out', 
      label: 'Clock In/Out', 
      icon: Clock,
      description: 'Record employee clock in and out times',
      href: '/time-management/clock-in-out'
    },
    { 
      id: 'correction-requests', 
      label: 'Correction Requests', 
      icon: AlertTriangle,
      description: 'Manage attendance correction requests',
      href: '/time-management/correction-requests'
    },
    { 
      id: 'time-exceptions', 
      label: 'Time Exceptions', 
      icon: AlertTriangle,
      description: 'Handle time-related exceptions and issues',
      href: '/time-management/time-exceptions'
    },
    { 
      id: 'overtime-rules', 
      label: 'Overtime Rules', 
      icon: TrendingUp,
      description: 'Configure overtime policies and rules',
      href: '/time-management/overtime-rules'
    },
    { 
      id: 'lateness-rules', 
      label: 'Lateness Rules', 
      icon: Bell,
      description: 'Set up lateness policies and penalties',
      href: '/time-management/lateness-rules'
    },
    { 
      id: 'holidays', 
      label: 'Holidays', 
      icon: Calendar,
      description: 'Manage holiday calendar and rest days',
      href: '/time-management/holidays'
    },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: FileText,
      description: 'Generate attendance, overtime, and exception reports',
      href: '/time-management/reports'
    },
  ];

  // Filter menu items based on role
  // Clock In/Out is visible for ALL roles and auto-populates with logged-in user
  // Department Employees can only see: Clock In/Out, Attendance Records, Correction Requests, 
  // Shift Assignments, Time Exceptions, and Holidays
  // System Admins can see: Shift Assignments, Shift Types, Shifts, Holidays, Correction Requests, 
  // Time Exceptions, Clock In/Out, and Attendance Records
  // System Admins should NOT see: Reports, Lateness Rules, Overtime Rules, Schedule Rules
  // HR Admins can see: Shift Assignments, Attendance Records, Lateness Rules, Correction Requests,
  // Time Exceptions, Holidays, Reports, and Clock In/Out
  // HR Admins should NOT see: Shifts, Shift Types, Schedule Rules, Overtime Rules
  // HR Managers can see: Shift Types, Schedule Rules, Attendance Records, Overtime Rules, Lateness Rules,
  // Correction Requests, Time Exceptions, Shift Assignments, Reports, and Clock In/Out
  // HR Managers should NOT see: Shifts, Holidays
  // Payroll Specialists can see: Attendance Records (to flag missed punches), Reports (to view and export overtime and exception reports), Clock In/Out
  // HR Employee is treated the same as Department Employee (same modules)
  // Other roles (Department Head, Payroll Manager, Legal Policy Admin, Recruiter, Finance Staff, Job Candidate) can only see: Clock In/Out
  let menuItems = allMenuItems;
  
  if (isDepartmentEmployee || isHREmployee) {
    // Department Employee and HR Employee see the same modules
    menuItems = allMenuItems.filter(item => 
      ['clock-in-out', 'attendance', 'correction-requests', 'shift-assignments', 'time-exceptions', 'holidays'].includes(item.id)
    );
  } else if (isSystemAdmin) {
    // System Admin: Show only required items
    // Hidden items: reports, lateness-rules, overtime-rules, schedule-rules
    menuItems = allMenuItems.filter(item => 
      ['shift-assignments', 'shift-types', 'shifts', 'holidays', 'correction-requests', 'time-exceptions', 'clock-in-out', 'attendance'].includes(item.id)
    );
  } else if (isHRAdmin) {
    // HR Admin: Show only required items based on requirements
    // Required: shift-assignments, attendance, correction-requests, time-exceptions, holidays, reports, clock-in-out
    // Hidden items: shifts, shift-types, schedule-rules, overtime-rules, lateness-rules
    menuItems = allMenuItems.filter(item => 
      ['shift-assignments', 'attendance', 'correction-requests', 'time-exceptions', 'holidays', 'reports', 'clock-in-out'].includes(item.id)
    );
  } else if (isHRManager) {
    // HR Manager: Show only required items based on requirements
    // Required: shift-types, schedule-rules, attendance, overtime-rules, lateness-rules, 
    // correction-requests, time-exceptions, shift-assignments, reports, clock-in-out
    // Hidden items: shifts, holidays
    menuItems = allMenuItems.filter(item => 
      ['shift-types', 'schedule-rules', 'attendance', 'overtime-rules', 'lateness-rules', 'correction-requests', 'time-exceptions', 'shift-assignments', 'reports', 'clock-in-out'].includes(item.id)
    );
  } else if (isPayrollSpecialist) {
    // Payroll Specialist: Show only required items based on requirements
    // Required: attendance (to flag missed punches and send alerts), reports (to view and export overtime and exception reports), clock-in-out
    // Hidden items: all others
    menuItems = allMenuItems.filter(item => 
      ['attendance', 'reports', 'clock-in-out'].includes(item.id)
    );
  } else if (isOtherRole) {
    // Other roles (Department Head, Payroll Manager, Legal Policy Admin, Recruiter, Finance Staff, Job Candidate)
    // Show only Clock In/Out
    menuItems = allMenuItems.filter(item => 
      ['clock-in-out'].includes(item.id)
    );
  }

  // Update descriptions based on role
  if (isDepartmentEmployee || isHREmployee) {
    // Department Employee and HR Employee have the same descriptions
    menuItems = menuItems.map(item => {
      const updatedDescriptions: Record<string, string> = {
        'shift-assignments': 'View your assigned shifts',
        'attendance': 'View your attendance records',
        'correction-requests': 'Submit and track your correction requests',
        'time-exceptions': 'View and create time exceptions for your records',
        'holidays': 'View holiday calendar',
      };
      return {
        ...item,
        description: updatedDescriptions[item.id] || item.description,
      };
    });
  } else if (isPayrollSpecialist) {
    menuItems = menuItems.map(item => {
      const updatedDescriptions: Record<string, string> = {
        'attendance': 'Flag missed punches and send alerts',
        'reports': 'View and export overtime and exception attendance reports for payroll and compliance',
      };
      return {
        ...item,
        description: updatedDescriptions[item.id] || item.description,
      };
    });
  } else if (isSystemAdmin) {
    menuItems = menuItems.map(item => {
      const updatedDescriptions: Record<string, string> = {
        'shift-assignments': 'Assign shifts to employees individually, by department, or by position',
        'shift-types': 'Define and configure shift types (Normal, Split, Overnight, Rotational, etc.)',
        'shifts': 'Configure shift templates including clock-in/out policies',
        'holidays': 'Define national holidays, organizational holidays, and weekly rest days',
        'correction-requests': 'Manage and review attendance correction requests with automatic escalation',
        'time-exceptions': 'Handle time-related exceptions with automatic escalation before payroll cut-off',
        'clock-in-out': 'Record employee clock in and out times',
        'attendance': 'View and manage attendance logs',
      };
      return {
        ...item,
        description: updatedDescriptions[item.id] || item.description,
      };
    });
  } else if (isHRAdmin) {
    menuItems = menuItems.map(item => {
      const updatedDescriptions: Record<string, string> = {
        'shift-assignments': 'Assign shifts to employees individually, by department, or by position and manage their statuses',
        'attendance': 'View and manage attendance records that sync daily with payroll and leave systems',
        'correction-requests': 'Review, approve, or reject attendance correction requests with automatic escalation',
        'time-exceptions': 'Review and manage time exceptions, define permission duration limits, with automatic escalation',
        'holidays': 'Define national holidays, organizational holidays, and weekly rest days',
        'reports': 'View and export overtime and exception attendance reports for payroll and compliance',
      };
      return {
        ...item,
        description: updatedDescriptions[item.id] || item.description,
      };
    });
  } else if (isHRManager) {
    menuItems = menuItems.map(item => {
      const updatedDescriptions: Record<string, string> = {
        'shift-types': 'Define and configure shift types (Normal, Split, Overnight, Rotational, etc.) and their corresponding names',
        'schedule-rules': 'Define flexible and custom scheduling rules (flex-in/flex-out hours, custom weekly patterns like 4 days on/3 off)',
        'attendance': 'Record or correct attendance manually, flag missed punches and send alerts, sync with payroll and leave modules',
        'overtime-rules': 'Configure overtime and short-time rules (including weekend, holiday, and pre-approval types)',
        'lateness-rules': 'Set grace periods, lateness thresholds, and automatic deductions, flag repeated lateness for disciplinary tracking',
        'correction-requests': 'Review, approve, or reject attendance correction requests with automatic escalation after deadlines',
        'time-exceptions': 'Review, approve, or reject time-related requests (permissions) with automatic escalation after deadlines',
        'shift-assignments': 'Link employee vacation packages to their schedules so time off is automatically reflected',
        'reports': 'View and export overtime and exception attendance reports for payroll and compliance checks',
      };
      return {
        ...item,
        description: updatedDescriptions[item.id] || item.description,
      };
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-slate-900 mb-2">Time Management</h1>
        <p className="text-slate-600">Manage shifts, attendance, and time tracking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              prefetch={false}
              className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow hover:border-slate-300"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <Icon className="w-6 h-6 text-slate-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-slate-900 font-semibold mb-1">{item.label}</h3>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
