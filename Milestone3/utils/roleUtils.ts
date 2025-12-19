/**
 * Utility functions for role checking
 */

/**
 * Normalizes a role string for comparison (lowercase, trim)
 */
export const normalizeRole = (role: string): string => {
  return (role || "").toLowerCase().trim();
};

/**
 * Checks if a user has a specific role (case-insensitive)
 */
export const hasRole = (userRoles: string[] | undefined | null, targetRole: string): boolean => {
  if (!userRoles || !Array.isArray(userRoles) || userRoles.length === 0) {
    return false;
  }
  
  const normalizedTarget = normalizeRole(targetRole);
  return userRoles.some(role => normalizeRole(role) === normalizedTarget);
};

/**
 * Checks if a user has any of the specified roles (case-insensitive)
 */
export const hasAnyRole = (userRoles: string[] | undefined | null, targetRoles: string[]): boolean => {
  if (!userRoles || !Array.isArray(userRoles) || userRoles.length === 0) {
    return false;
  }
  
  const normalizedTargets = targetRoles.map(r => normalizeRole(r));
  return userRoles.some(role => normalizedTargets.includes(normalizeRole(role)));
};

/**
 * Checks if user is System Admin (handles various formats)
 */
export const isSystemAdmin = (userRoles: string[] | undefined | null): boolean => {
  if (!userRoles) {
    return false;
  }
  
  const rolesArray = Array.isArray(userRoles) ? userRoles : [];
  
  if (rolesArray.length === 0) {
    return false;
  }
  
  const normalizedRoles = rolesArray.map(r => {
    if (typeof r !== 'string') {
      return "";
    }
    return normalizeRole(r);
  });
  
  return normalizedRoles.includes("system admin") || 
         normalizedRoles.includes("system_admin") ||
         normalizedRoles.includes("systemadmin");
};

/**
 * Checks if user is HR Manager
 */
export const isHRManager = (userRoles: string[] | undefined | null): boolean => {
  return hasRole(userRoles, 'HR Manager');
};

/**
 * Checks if user is HR Employee
 */
export const isHREmployee = (userRoles: string[] | undefined | null): boolean => {
  return hasRole(userRoles, 'HR Employee');
};

/**
 * Checks if user is Recruiter
 */
export const isRecruiter = (userRoles: string[] | undefined | null): boolean => {
  return hasRole(userRoles, 'Recruiter');
};

/**
 * Checks if user is Job Candidate
 */
export const isCandidate = (userRoles: string[] | undefined | null): boolean => {
  return hasRole(userRoles, 'Job Candidate');
};

/**
 * Checks if user is New Hire
 */
export const isNewHire = (userRoles: string[] | undefined | null): boolean => {
  return hasRole(userRoles, 'New Hire');
};

/**
 * Checks if user has any recruitment-related role
 */
export const hasRecruitmentAccess = (userRoles: string[] | undefined | null): boolean => {
  const recruitmentRoles = [
    'System Admin',
    'HR Admin',
    'HR Manager',
    'HR Employee',
    'Recruiter',
  ];
  return hasAnyRole(userRoles, recruitmentRoles);
};

/**
 * Gets all roles for a user (normalized)
 */
export const getUserRoles = (userRoles: string[] | undefined | null): string[] => {
  if (!userRoles || !Array.isArray(userRoles)) {
    return [];
  }
  return userRoles;
};

/**
 * Get display-friendly role name
 */
export const getRoleDisplayName = (role: string): string => {
  const roleMap: Record<string, string> = {
    'system admin': 'System Admin',
    'hr admin': 'HR Admin',
    'hr manager': 'HR Manager',
    'hr employee': 'HR Employee',
    'department head': 'Department Head',
    'department employee': 'Department Employee',
    'payroll manager': 'Payroll Manager',
    'payroll specialist': 'Payroll Specialist',
    'recruiter': 'Recruiter',
    'legal & policy admin': 'Legal & Policy Admin',
    'finance staff': 'Finance Staff',
    'job candidate': 'Job Candidate',
    'new hire': 'New Hire',
  };
  
  return roleMap[normalizeRole(role)] || role;
};
