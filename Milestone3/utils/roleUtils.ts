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
 * This function prioritizes System Admin role even if user has multiple roles
 */
export const isSystemAdmin = (userRoles: string[] | undefined | null): boolean => {
  if (!userRoles) {
    console.log("isSystemAdmin: No roles provided", { userRoles });
    return false;
  }
  
  // Ensure it's an array
  const rolesArray = Array.isArray(userRoles) ? userRoles : [];
  
  if (rolesArray.length === 0) {
    console.log("isSystemAdmin: Empty roles array");
    return false;
  }
  
  // Normalize all roles (lowercase, trim)
  const normalizedRoles = rolesArray.map(r => {
    if (typeof r !== 'string') {
      console.warn("isSystemAdmin: Non-string role found:", r);
      return "";
    }
    return normalizeRole(r);
  });
  
  const hasSystemAdmin = normalizedRoles.includes("system admin") || 
                        normalizedRoles.includes("system_admin") ||
                        normalizedRoles.includes("systemadmin");
  
  // Log for debugging (only if roles exist)
  console.log("isSystemAdmin check:", {
    originalRoles: rolesArray,
    normalizedRoles: normalizedRoles,
    hasSystemAdmin: hasSystemAdmin,
    rolesType: typeof userRoles,
    isArray: Array.isArray(userRoles),
  });
  
  return hasSystemAdmin;
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

