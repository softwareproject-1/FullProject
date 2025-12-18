/**
 * Role-Based Access Control Utility
 * Based on SYSTEM_ROLES_ACCESS_MATRIX.txt
 * 
 * This file defines what each role can access in the frontend
 */

export enum SystemRole {
  SYSTEM_ADMIN = 'System Admin',
  HR_ADMIN = 'HR Admin',
  HR_MANAGER = 'HR Manager',
  HR_EMPLOYEE = 'HR Employee',
  DEPARTMENT_HEAD = 'department head',
  DEPARTMENT_EMPLOYEE = 'department employee',
  PAYROLL_MANAGER = 'Payroll Manager',
  PAYROLL_SPECIALIST = 'Payroll Specialist',
  RECRUITER = 'Recruiter',
  LEGAL_POLICY_ADMIN = 'Legal & Policy Admin',
  FINANCE_STAFF = 'Finance Staff',
  JOB_CANDIDATE = 'Job Candidate',
  NEW_HIRE = 'New Hire',
}

// Normalize role name (case-insensitive matching)
export const normalizeRole = (role: string): string => {
  return role?.toLowerCase().trim() || '';
};

// Check if user has a specific role (case-insensitive)
export const hasRole = (userRoles: string[] | undefined, role: SystemRole | string): boolean => {
  if (!userRoles || userRoles.length === 0) return false;
  const normalizedUserRoles = userRoles.map(normalizeRole);
  const normalizedTargetRole = normalizeRole(role);
  return normalizedUserRoles.includes(normalizedTargetRole);
};

// Check if user has any of the specified roles
export const hasAnyRole = (userRoles: string[] | undefined, roles: (SystemRole | string)[]): boolean => {
  if (!userRoles || userRoles.length === 0) return false;
  return roles.some(role => hasRole(userRoles, role));
};

// Check if user has all of the specified roles
export const hasAllRoles = (userRoles: string[] | undefined, roles: (SystemRole | string)[]): boolean => {
  if (!userRoles || userRoles.length === 0) return false;
  return roles.every(role => hasRole(userRoles, role));
};

// Role-based access configuration
export const roleAccess = {
  // System Admin - Full access
  [SystemRole.SYSTEM_ADMIN]: {
    routes: [
      '/',
      '/admin',
      '/admin/employee-profile',
      '/employee/profile',
      '/admin/employee-profile/change-requests',
      '/admin/organization-structure',
      '/admin/organization-structure/departments',
      '/admin/organization-structure/positions',
      '/performance',
      '/performance/templates',
      '/performance/cycles',
      '/performance/disputes',
      '/hr-manager',
      '/hr-manager/onboarding',
      '/time-management',
      '/leaves',
      '/payroll',
      '/payroll-tracking',
      '/recruitment',
      '/offboarding',
    ],
    features: {
      viewAllEmployees: true,
      viewOwnProfile: true,
      editOwnProfile: true,
      createEmployee: true,
      editEmployee: true,
      deleteEmployee: true,
      assignRoles: true,
      manageChangeRequests: true,
      approveChangeRequests: true,
      createDepartments: true,
      editDepartments: true,
      deleteDepartments: true,
      createPositions: true,
      editPositions: true,
      deletePositions: true,
      createAppraisalTemplates: true,
      manageAppraisalCycles: true,
      deleteAssignments: true,
      updateAssignmentStatus: true,
      evaluateEmployees: true,
      viewAllPerformance: true,
      resolveDisputes: true,
      archiveEmployees: true,
      viewPayroll: true,
      // Recruitment features
      manageRecruitment: true,
      viewCandidates: true,
      createCandidate: true,
      editCandidate: true,
      manageJobPostings: true,
      scheduleInterviews: true,
      manageOffers: true,
      manageOnboarding: true,
      manageOffboarding: true,
      viewRecruitmentAnalytics: true,
      manageHiringStages: true,
      manageReferrals: true,
    },
    defaultRoute: '/admin',
  },

  // HR Admin - High HR access
  [SystemRole.HR_ADMIN]: {
    routes: [
      '/',
      '/admin/employee-profile',
      '/employee/profile',
      '/admin/employee-profile/change-requests',
      '/performance',
      '/performance/templates',
      '/performance/cycles',
      '/performance/disputes',
      '/hr-manager',
      '/hr-manager/onboarding',
      '/time-management',
      '/leaves',
      '/payroll',
      '/recruitment',
      '/offboarding',
    ],
    features: {
      viewAllEmployees: true,
      viewOwnProfile: true,
      editOwnProfile: true,
      createEmployee: true,
      editEmployee: true,
      deleteEmployee: false,
      assignRoles: true, // HR roles only
      manageChangeRequests: true,
      approveChangeRequests: true,
      createDepartments: false,
      editDepartments: false,
      deleteDepartments: false,
      createPositions: false,
      editPositions: false,
      deletePositions: false,
      createAppraisalTemplates: true,
      manageAppraisalCycles: true,
      deleteAssignments: true,
      updateAssignmentStatus: true,
      evaluateEmployees: true,
      viewAllPerformance: true,
      resolveDisputes: true,
      archiveEmployees: false,
      viewPayroll: true,
      // Recruitment features
      manageRecruitment: true,
      viewCandidates: true,
      createCandidate: true,
      editCandidate: true,
      manageJobPostings: true,
      scheduleInterviews: true,
      manageOffers: true,
      manageOnboarding: true,
      manageOffboarding: true,
      viewRecruitmentAnalytics: true,
      manageHiringStages: true,
      manageReferrals: true,
    },
    defaultRoute: '/hr-manager',
  },

  // HR Manager - Medium-High HR access
  [SystemRole.HR_MANAGER]: {
    routes: [
      '/',
      '/hr-manager',
      '/hr-manager/onboarding',
      '/admin/employee-profile',
      '/employee/profile',
      '/admin/employee-profile/change-requests',
      '/performance',
      '/performance/templates',
      '/performance/cycles',
      '/performance/disputes',
      '/time-management',
      '/leaves',
      '/payroll/payroll-tracking/employee',
      '/recruitment',
      '/offboarding',
    ],
    features: {
      viewAllEmployees: true, // Read-only
      viewOwnProfile: true,
      editOwnProfile: true,
      createEmployee: false,
      editEmployee: false,
      deleteEmployee: false,
      assignRoles: false,
      manageChangeRequests: true,
      approveChangeRequests: true,
      createDepartments: false,
      editDepartments: false,
      deleteDepartments: false,
      createPositions: false,
      editPositions: false,
      deletePositions: false,
      createAppraisalTemplates: true,
      manageAppraisalCycles: true,
      resolveDisputes: true,
      archiveEmployees: false,
      viewPayroll: false,
      // Recruitment features
      manageRecruitment: true,
      viewCandidates: true,
      createCandidate: true,
      editCandidate: true,
      manageJobPostings: true,
      scheduleInterviews: true,
      manageOffers: true,
      manageOnboarding: true,
      manageOffboarding: true,
      viewRecruitmentAnalytics: true,
      manageHiringStages: true,
      manageReferrals: true,
    },
    defaultRoute: '/hr-manager',
  },

  // HR Employee - Medium HR access
  [SystemRole.HR_EMPLOYEE]: {
    routes: [
      '/',
      '/admin/employee-profile',
      '/employee/profile',
      '/admin/employee-profile/change-requests', // Can process (data entry, not approval)
      '/performance',
      '/performance/templates', // Can view templates
      '/performance/cycles', // Can assist in setup
      '/admin/organization-structure', // Can view organizational charts (read-only)
      '/time-management',
      '/leaves',
      '/payroll/payroll-tracking/employee',
      '/recruitment', // Can assist recruitment
    ],
    features: {
      viewAllEmployees: true,
      viewOwnProfile: true,
      editOwnProfile: true,
      createEmployee: false,
      editEmployee: false, // Cannot edit directly - must use change requests
      deleteEmployee: false,
      assignRoles: false,
      manageChangeRequests: true, // Can process change requests (data entry)
      approveChangeRequests: false, // Cannot approve/reject
      createDepartments: false,
      editDepartments: false,
      deleteDepartments: false,
      createPositions: false,
      editPositions: false,
      deletePositions: false,
      createAppraisalTemplates: false, // Cannot create, but can view
      viewAppraisalTemplates: true, // Can view templates
      manageAppraisalCycles: false, // Cannot manage, but can assist
      assistAppraisalCycles: true, // Can assist in setup under HR Manager supervision
      viewAllPerformance: false, // Cannot view detailed results
      viewPerformanceStatus: true, // Can view evaluation status (not detailed results)
      resolveDisputes: false,
      archiveEmployees: false,
      viewPayroll: false,
      manageRecruitment: false, // Cannot manage, but can assist
      assistRecruitment: true, // Can assist in recruitment (data entry, scheduling)
      viewOrganizationalCharts: true, // Can view organizational charts (read-only)
      viewEmployeeQualifications: true, // Can view employee qualifications
      generateBasicReports: true, // Can generate basic HR reports
      // Recruitment assist features
      viewCandidates: true,
      scheduleInterviews: true,
      viewOnboarding: true,
      assistOnboarding: true,
    },
    defaultRoute: '/admin/employee-profile',
  },

  // Department Head - Medium department access
  [SystemRole.DEPARTMENT_HEAD]: {
    routes: [
      '/admin/employee-profile', // View own profile and team members (non-sensitive)
      '/employee/profile',
      '/performance',
      '/performance/cycles',
      '/performance/cycles/*/evaluate',
      '/performance/team-results',
      '/admin/organization-structure', // View organizational structure (read-only)
      '/time-management',
      '/leaves',
      '/payroll/payroll-tracking/employee',
    ],
    features: {
      viewAllEmployees: false,
      viewTeamEmployees: true,
      viewOwnProfile: true,
      editOwnProfile: true,
      createEmployee: false,
      editEmployee: false,
      deleteEmployee: false,
      assignRoles: false,
      manageChangeRequests: false,
      approveChangeRequests: false,
      createDepartments: false,
      editDepartments: false,
      deleteDepartments: false,
      createPositions: false,
      editPositions: false,
      deletePositions: false,
      viewOrganizationalCharts: true, // Read-only access
      createAppraisalTemplates: false,
      manageAppraisalCycles: false,
      evaluateEmployees: true,
      viewTeamPerformance: true,
      resolveDisputes: false,
      archiveEmployees: false,
      viewPayroll: false,
      manageRecruitment: false,
    },
    defaultRoute: '/',
  },

  // Department Employee - Low access (self-service)
  [SystemRole.DEPARTMENT_EMPLOYEE]: {
    routes: [
      '/performance',
      '/performance/my-performance', // View own performance
      '/performance/disputes', // Can submit disputes
      '/admin/employee-profile', // Can view own profile
      '/employee/profile', // Self-service profile editing
      '/admin/organization-structure', // View basic organizational structure (own position and department)
      '/time-management',
      '/leaves',
      '/payroll/payroll-tracking/employee',
    ],
    features: {
      viewAllEmployees: false,
      viewOwnProfile: true,
      editOwnProfile: true, // Non-critical fields only
      submitChangeRequests: true, // Can submit change requests for governed fields
      createEmployee: false,
      editEmployee: false,
      deleteEmployee: false,
      assignRoles: false,
      manageChangeRequests: false,
      approveChangeRequests: false,
      createDepartments: false,
      editDepartments: false,
      deleteDepartments: false,
      createPositions: false,
      editPositions: false,
      deletePositions: false,
      viewOrganizationalCharts: true, // Basic view (own position and department)
      createAppraisalTemplates: false,
      manageAppraisalCycles: false,
      viewOwnPerformance: true,
      submitDisputes: true,
      resolveDisputes: false,
      archiveEmployees: false,
      viewPayroll: false,
      manageRecruitment: false,
    },
    defaultRoute: '/',
  },

  // Payroll Manager - Medium-High payroll access
  [SystemRole.PAYROLL_MANAGER]: {
    routes: [
      '/admin/employee-profile', // Payroll fields only
      '/admin/employee-profile/[id]/edit', // Can edit employee payroll data
      '/employee/profile', // Self-service profile editing
      '/payroll',
      '/payroll-execution',
    ],
    features: {
      viewAllEmployees: true, // Payroll fields only
      viewOwnProfile: true,
      editOwnProfile: true,
      createEmployee: false,
      editEmployee: true, // Can edit payroll data only (restricted in UI)
      deleteEmployee: false,
      assignRoles: false,
      manageChangeRequests: false,
      approveChangeRequests: false,
      createDepartments: false,
      editDepartments: false,
      deleteDepartments: false,
      createPositions: false,
      editPositions: false,
      deletePositions: false,
      viewOrganizationalCharts: false, // Cannot manage organizational structure
      createAppraisalTemplates: false,
      manageAppraisalCycles: false,
      viewAllPerformance: false,
      resolveDisputes: false,
      archiveEmployees: false,
      viewPayroll: true,
      editPayroll: true, // Can edit payroll data
      manageRecruitment: false,
    },
    defaultRoute: '/',
  },

  // Payroll Specialist - Medium payroll access
  [SystemRole.PAYROLL_SPECIALIST]: {
    routes: [
      '/admin/employee-profile', // Read-only payroll fields
      '/employee/profile', // Self-service profile editing
      '/payroll', // View-only payroll access
      '/payroll-execution',

    ],
    features: {
      viewAllEmployees: true, // Payroll fields only
      viewOwnProfile: true, // Can view own profile
      editOwnProfile: true, // Can edit own profile (limited fields)
      createEmployee: false,
      editEmployee: false,
      deleteEmployee: false,
      assignRoles: false,
      manageChangeRequests: false,
      approveChangeRequests: false,
      createDepartments: false,
      editDepartments: false,
      deleteDepartments: false,
      createPositions: false,
      editPositions: false,
      deletePositions: false,
      viewOrganizationalCharts: false,
      createAppraisalTemplates: false,
      manageAppraisalCycles: false,
      viewAllPerformance: false,
      resolveDisputes: false,
      archiveEmployees: false,
      viewPayroll: true,
      editPayroll: false, // Read-only
      manageRecruitment: false,
    },
    defaultRoute: '/admin/employee-profile',
  },

  // Recruiter - Medium recruitment access
  [SystemRole.RECRUITER]: {
    routes: [
      '/',
      '/admin/employee-profile', // Candidates only
      '/employee/profile', // Self-service profile editing
      '/admin/organization-structure', // View organizational structure (to understand open positions)
      '/recruiter', // Recruiter dashboard
      '/recruitment',
      '/payroll/payroll-tracking/employee',
    ],
    features: {
      viewAllEmployees: false,
      viewOwnProfile: true,
      editOwnProfile: true,
      viewCandidates: true,
      createCandidate: true,
      editCandidate: true,
      deleteEmployee: false,
      assignRoles: false,
      manageChangeRequests: false,
      approveChangeRequests: false,
      createDepartments: false,
      editDepartments: false,
      deleteDepartments: false,
      createPositions: false,
      editPositions: false,
      deletePositions: false,
      viewOrganizationalCharts: true, // Read-only to understand open positions
      createAppraisalTemplates: false,
      manageAppraisalCycles: false,
      viewAllPerformance: false,
      resolveDisputes: false,
      archiveEmployees: false,
      viewPayroll: false,
      // Recruitment features
      manageRecruitment: true,
      manageJobPostings: true,
      scheduleInterviews: true,
      viewOnboarding: true,
      assistOnboarding: true,
      viewRecruitmentAnalytics: true,
      manageReferrals: true,
    },
    defaultRoute: '/recruitment',
  },

  // Legal & Policy Admin - Medium legal/policy access
  [SystemRole.LEGAL_POLICY_ADMIN]: {
    routes: [
      '/admin/employee-profile', // Read-only for compliance
      '/employee/profile', // Self-service profile editing
      '/admin/organization-structure', // View organizational structure (for compliance)
      '/payroll/payroll-tracking/employee',
    ],
    features: {
      viewAllEmployees: true, // Compliance data only
      viewOwnProfile: true,
      editOwnProfile: true,
      createEmployee: false,
      editEmployee: false,
      deleteEmployee: false,
      assignRoles: false,
      manageChangeRequests: false,
      approveChangeRequests: false,
      createDepartments: false,
      editDepartments: false,
      deleteDepartments: false,
      createPositions: false,
      editPositions: false,
      deletePositions: false,
      viewOrganizationalCharts: true, // Read-only for compliance
      createAppraisalTemplates: false,
      manageAppraisalCycles: false,
      viewAllPerformance: false,
      resolveDisputes: false,
      archiveEmployees: false,
      viewPayroll: false,
      manageRecruitment: false,
    },
    defaultRoute: '/',
  },

  // Finance Staff - Medium finance access
  [SystemRole.FINANCE_STAFF]: {
    routes: [
      '/admin/employee-profile', // Read-only finance fields
      '/employee/profile', // Self-service profile editing
      '/admin/organization-structure', // View organizational structure (for budget planning)
      '/payroll', // Read-only payroll view
      '/payroll-execution',

    ],
    features: {
      viewAllEmployees: true, // Finance fields only
      viewOwnProfile: true,
      editOwnProfile: true,
      createEmployee: false,
      editEmployee: false,
      deleteEmployee: false,
      assignRoles: false,
      manageChangeRequests: false,
      approveChangeRequests: false,
      createDepartments: false,
      editDepartments: false,
      deleteDepartments: false,
      createPositions: false,
      editPositions: false,
      deletePositions: false,
      viewOrganizationalCharts: true, // Read-only for budget planning
      createAppraisalTemplates: false,
      manageAppraisalCycles: false,
      viewAllPerformance: false,
      resolveDisputes: false,
      archiveEmployees: false,
      viewPayroll: true, // Read-only
      editPayroll: false,
      manageRecruitment: false,
    },
    defaultRoute: '/',
  },

  // Job Candidate - Candidate portal access
  [SystemRole.JOB_CANDIDATE]: {
    routes: [
      '/candidate',
      '/candidate/profile',
      '/candidate/applications',
      '/candidate/onboarding',
    ],
    features: {
      viewAllEmployees: false,
      viewOwnCandidateProfile: true,
      editOwnCandidateProfile: true,
      viewApplicationStatus: true,
      applyToJobs: true,
      uploadDocuments: true,
      createEmployee: false,
      editEmployee: false,
      deleteEmployee: false,
      assignRoles: false,
      manageChangeRequests: false,
      approveChangeRequests: false,
      createDepartments: false,
      editDepartments: false,
      deleteDepartments: false,
      createPositions: false,
      editPositions: false,
      deletePositions: false,
      createAppraisalTemplates: false,
      manageAppraisalCycles: false,
      viewAllPerformance: false,
      resolveDisputes: false,
      archiveEmployees: false,
      viewPayroll: false,
      manageRecruitment: false,
      // Onboarding features for candidates
      viewOnboardingTasks: true,
      completeOnboardingTasks: true,
      uploadOnboardingDocuments: true,
      viewOnboardingProgress: true,
    },
    defaultRoute: '/candidate',
  },

  // New Hire - Onboarding access
  [SystemRole.NEW_HIRE]: {
    routes: [
      '/',
      '/recruitment',
      '/employee/profile',
    ],
    features: {
      viewOwnProfile: true,
      editOwnProfile: true,
      viewOnboardingTasks: true,
      completeOnboardingTasks: true,
      uploadOnboardingDocuments: true,
      viewOnboardingProgress: true,
    },
    defaultRoute: '/',
  },
};

// Type definitions for role access
export interface RoleAccessConfig {
  routes: string[];
  features: Record<string, boolean>;
  defaultRoute: string;
}

// Get access configuration for a role
export const getRoleAccess = (role: SystemRole | string): RoleAccessConfig => {
  if (!role) {
    console.warn('getRoleAccess: No role provided');
    return roleAccess[SystemRole.DEPARTMENT_EMPLOYEE];
  }

  const normalizedRole = normalizeRole(role);

  // First try exact match (case-insensitive)
  const roleKey = Object.keys(roleAccess).find(
    key => normalizeRole(key) === normalizedRole
  ) as SystemRole | undefined;

  if (roleKey) {
    return roleAccess[roleKey];
  }

  // If not found, try matching against enum values directly
  const enumValues = Object.values(SystemRole);
  const matchingEnumValue = enumValues.find(
    enumValue => normalizeRole(enumValue) === normalizedRole
  );

  if (matchingEnumValue) {
    return roleAccess[matchingEnumValue];
  }

  // Log warning for debugging
  console.warn('getRoleAccess: Role not found in roleAccess config:', {
    originalRole: role,
    normalizedRole: normalizedRole,
    availableRoles: Object.keys(roleAccess),
    availableEnumValues: enumValues,
  });

  // Default to department employee access if role not found
  return roleAccess[SystemRole.DEPARTMENT_EMPLOYEE];
};

// Get combined access for multiple roles (union of all permissions)
export const getCombinedAccess = (userRoles: string[] | undefined): RoleAccessConfig => {
  if (!userRoles || userRoles.length === 0) {
    console.log('getCombinedAccess: No roles provided, using default');
    return roleAccess[SystemRole.DEPARTMENT_EMPLOYEE];
  }

  // Ensure roles is a proper array of strings
  const validRoles = userRoles
    .filter(role => role && typeof role === 'string')
    .map(role => String(role).trim())
    .filter(role => role.length > 0);

  if (validRoles.length === 0) {
    console.warn('getCombinedAccess: No valid roles found after filtering:', userRoles);
    return roleAccess[SystemRole.DEPARTMENT_EMPLOYEE];
  }

  const accessConfigs = validRoles.map(role => getRoleAccess(role));

  // Combine routes (union)
  const combinedRoutes = Array.from(
    new Set(accessConfigs.flatMap(config => config.routes || []))
  );

  // Combine features (if any role has it, user has it)
  const combinedFeatures: Record<string, boolean> = {};
  const allFeatureKeys = new Set(
    accessConfigs.flatMap(config => Object.keys(config.features || {}))
  );

  allFeatureKeys.forEach(key => {
    combinedFeatures[key] = accessConfigs.some(config => config.features?.[key] === true);
  });

  // Get default route from highest priority role
  const priorityOrder = [
    SystemRole.SYSTEM_ADMIN,
    SystemRole.HR_ADMIN,
    SystemRole.HR_MANAGER,
    SystemRole.RECRUITER,
    SystemRole.PAYROLL_MANAGER,
    SystemRole.DEPARTMENT_HEAD,
    SystemRole.JOB_CANDIDATE,
    SystemRole.NEW_HIRE,
  ];

  let defaultRoute = '/';
  for (const priorityRole of priorityOrder) {
    if (hasRole(validRoles, priorityRole)) {
      defaultRoute = roleAccess[priorityRole].defaultRoute;
      break;
    }
  }

  return {
    routes: combinedRoutes,
    features: combinedFeatures,
    defaultRoute,
  };
};

// Check if user can access a route
export const canAccessRoute = (userRoles: string[] | undefined, route: string): boolean => {
  if (!userRoles || userRoles.length === 0) return false;

  const access = getCombinedAccess(userRoles);

  // Check exact match first
  if (access.routes.includes(route)) {
    return true;
  }

  // Check if route is a sub-route of any allowed route
  // e.g., if user has access to /admin/organization-structure,
  // they should have access to /admin/organization-structure/departments
  for (const allowedRoute of access.routes) {
    if (route.startsWith(allowedRoute + '/') || route === allowedRoute) {
      return true;
    }
  }

  return false;
};

// Check if user has a specific feature
export const hasFeature = (userRoles: string[] | undefined, feature: string): boolean => {
  if (!userRoles || userRoles.length === 0) {
    return false;
  }

  // Ensure roles is a proper array
  const validRoles = Array.isArray(userRoles)
    ? userRoles.filter(role => role && typeof role === 'string').map(r => String(r).trim())
    : [];

  if (validRoles.length === 0) {
    return false;
  }

  const access = getCombinedAccess(validRoles);
  const hasFeatureAccess = access.features?.[feature] === true;

  return hasFeatureAccess;
};

// Get default route for user based on their roles
export const getDefaultRoute = (userRoles: string[] | undefined): string => {
  const access = getCombinedAccess(userRoles);
  return access.defaultRoute;
};

