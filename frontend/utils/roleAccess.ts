/**
 * Role-Based Access Control Utility
 * Integrated from Milestone3 with Recruitment-specific features
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
export const roleAccess: Record<string, RoleAccessConfig> = {
  // System Admin - Full access
  [SystemRole.SYSTEM_ADMIN]: {
    routes: [
      '/',
      '/admin',
      '/admin/employee-profile',
      '/admin/employee-profile/change-requests',
      '/admin/organization-structure',
      '/admin/organization-structure/departments',
      '/admin/organization-structure/positions',
      '/employee-profile',
      '/organization-structure',
      '/performance',
      '/performance/templates',
      '/performance/cycles',
      '/performance/disputes',
      '/hr-manager',
      '/hr-manager/onboarding',
      '/recruitment',
      '/time-management',
      '/leaves',
      '/payroll',
      '/payroll-tracking',
    ],
    features: {
      viewAllEmployees: true,
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
      '/admin/employee-profile/change-requests',
      '/employee-profile',
      '/performance',
      '/performance/templates',
      '/performance/cycles',
      '/performance/disputes',
      '/hr-manager',
      '/hr-manager/onboarding',
      '/recruitment',
      '/time-management',
      '/leaves',
      '/payroll',
    ],
    features: {
      viewAllEmployees: true,
      createEmployee: true,
      editEmployee: true,
      deleteEmployee: false,
      assignRoles: true,
      manageChangeRequests: true,
      approveChangeRequests: true,
      createAppraisalTemplates: true,
      manageAppraisalCycles: true,
      deleteAssignments: true,
      updateAssignmentStatus: true,
      evaluateEmployees: true,
      viewAllPerformance: true,
      resolveDisputes: true,
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
    defaultRoute: '/',
  },

  // HR Manager - Medium-High HR access
  [SystemRole.HR_MANAGER]: {
    routes: [
      '/',
      '/hr-manager',
      '/hr-manager/onboarding',
      '/admin/employee-profile',
      '/admin/employee-profile/change-requests',
      '/employee-profile',
      '/performance',
      '/performance/templates',
      '/performance/cycles',
      '/performance/disputes',
      '/recruitment',
      '/time-management',
      '/leaves',
    ],
    features: {
      viewAllEmployees: true,
      createEmployee: false,
      editEmployee: false,
      manageChangeRequests: true,
      approveChangeRequests: true,
      createAppraisalTemplates: true,
      manageAppraisalCycles: true,
      resolveDisputes: true,
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
    defaultRoute: '/',
  },

  // HR Employee - Medium HR access
  [SystemRole.HR_EMPLOYEE]: {
    routes: [
      '/',
      '/admin/employee-profile',
      '/admin/employee-profile/change-requests',
      '/employee-profile',
      '/performance',
      '/performance/templates',
      '/performance/cycles',
      '/admin/organization-structure',
      '/organization-structure',
      '/recruitment',
      '/time-management',
      '/leaves',
    ],
    features: {
      viewAllEmployees: true,
      manageChangeRequests: true,
      viewAppraisalTemplates: true,
      assistAppraisalCycles: true,
      viewPerformanceStatus: true,
      viewOrganizationalCharts: true,
      viewEmployeeQualifications: true,
      generateBasicReports: true,
      // Recruitment features - assist level
      assistRecruitment: true,
      viewCandidates: true,
      scheduleInterviews: true,
      viewOnboarding: true,
      assistOnboarding: true,
    },
    defaultRoute: '/employee-profile',
  },

  // Department Head - Medium department access
  [SystemRole.DEPARTMENT_HEAD]: {
    routes: [
      '/',
      '/admin/employee-profile',
      '/employee-profile',
      '/performance',
      '/performance/cycles',
      '/performance/team-results',
      '/admin/organization-structure',
      '/organization-structure',
      '/time-management',
      '/leaves',
    ],
    features: {
      viewTeamEmployees: true,
      viewOwnProfile: true,
      viewOrganizationalCharts: true,
      evaluateEmployees: true,
      viewTeamPerformance: true,
    },
    defaultRoute: '/',
  },

  // Department Employee - Low access (self-service)
  [SystemRole.DEPARTMENT_EMPLOYEE]: {
    routes: [
      '/',
      '/performance',
      '/performance/my-performance',
      '/performance/disputes',
      '/admin/employee-profile',
      '/employee-profile',
      '/admin/organization-structure',
      '/organization-structure',
      '/recruitment',
      '/offboarding',
      '/time-management',
      '/leaves',
    ],
    features: {
      viewOwnProfile: true,
      editOwnProfile: true,
      submitChangeRequests: true,
      viewOrganizationalCharts: true,
      viewOwnPerformance: true,
      submitDisputes: true,
      viewCandidates: false,
      viewRecruitment: true,
      viewOffboarding: true,
    },
    defaultRoute: '/',
  },

  // Payroll Manager
  [SystemRole.PAYROLL_MANAGER]: {
    routes: [
      '/',
      '/admin/employee-profile',
      '/employee-profile',
      '/admin/organization-structure',
      '/organization-structure',
      '/payroll',
      '/payroll-tracking',
    ],
    features: {
      viewAllEmployees: true,
      viewOrganizationalCharts: true,
      viewPayroll: true,
      editPayroll: true,
    },
    defaultRoute: '/payroll',
  },

  // Payroll Specialist
  [SystemRole.PAYROLL_SPECIALIST]: {
    routes: [
      '/',
      '/admin/employee-profile',
      '/employee-profile',
      '/admin/organization-structure',
      '/organization-structure',
      '/payroll',
      '/payroll-tracking',
    ],
    features: {
      viewAllEmployees: true,
      viewOrganizationalCharts: true,
      viewPayroll: true,
    },
    defaultRoute: '/payroll',
  },

  // Recruiter - Recruitment access
  [SystemRole.RECRUITER]: {
    routes: [
      '/',
      '/admin/employee-profile',
      '/employee-profile',
      '/admin/organization-structure',
      '/organization-structure',
      '/recruiter',
      '/recruitment',
    ],
    features: {
      viewCandidates: true,
      createCandidate: true,
      editCandidate: true,
      viewOrganizationalCharts: true,
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

  // Legal & Policy Admin
  [SystemRole.LEGAL_POLICY_ADMIN]: {
    routes: [
      '/',
      '/admin/employee-profile',
      '/employee-profile',
      '/admin/organization-structure',
      '/organization-structure',
    ],
    features: {
      viewAllEmployees: true,
      viewOrganizationalCharts: true,
    },
    defaultRoute: '/',
  },

  // Finance Staff
  [SystemRole.FINANCE_STAFF]: {
    routes: [
      '/',
      '/admin/employee-profile',
      '/employee-profile',
      '/admin/organization-structure',
      '/organization-structure',
      '/payroll',
      '/payroll-tracking',
    ],
    features: {
      viewAllEmployees: true,
      viewOrganizationalCharts: true,
      viewPayroll: true,
    },
    defaultRoute: '/payroll',
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
      viewOwnCandidateProfile: true,
      editOwnCandidateProfile: true,
      viewApplicationStatus: true,
      applyToJobs: true,
      uploadDocuments: true,
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
      '/employee-profile',
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
  
  // Default to department employee access if role not found
  return roleAccess[SystemRole.DEPARTMENT_EMPLOYEE];
};

// Get combined access for multiple roles (union of all permissions)
export const getCombinedAccess = (userRoles: string[] | undefined): RoleAccessConfig => {
  if (!userRoles || userRoles.length === 0) {
    return roleAccess[SystemRole.DEPARTMENT_EMPLOYEE];
  }

  // Ensure roles is a proper array of strings
  const validRoles = userRoles
    .filter(role => role && typeof role === 'string')
    .map(role => String(role).trim())
    .filter(role => role.length > 0);

  if (validRoles.length === 0) {
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
  const access = getCombinedAccess(userRoles);
  // Check exact match or prefix match
  return access.routes.some(r => route === r || route.startsWith(r + '/'));
};

// Check if user has a specific feature
export const hasFeature = (userRoles: string[] | undefined, feature: string): boolean => {
  if (!userRoles || userRoles.length === 0) {
    return false;
  }
  
  const validRoles = Array.isArray(userRoles) 
    ? userRoles.filter(role => role && typeof role === 'string').map(r => String(r).trim())
    : [];
  
  if (validRoles.length === 0) {
    return false;
  }
  
  const access = getCombinedAccess(validRoles);
  return access.features?.[feature] === true;
};

// Get default route for user based on their roles
export const getDefaultRoute = (userRoles: string[] | undefined): string => {
  const access = getCombinedAccess(userRoles);
  return access.defaultRoute;
};
