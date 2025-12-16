"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import RouteGuard from "@/components/RouteGuard";
import { getEmployeeProfileById, EmployeeProfile, assignEmployeeSystemRoles } from "@/utils/employeeProfileApi";
import { canAccessRoute, hasFeature, hasRole, SystemRole } from "@/utils/roleAccess";
import { authApi } from "@/utils/authApi";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import axiosInstance from "@/utils/ApiClient";

export default function EmployeeProfileDetailPage() {
  const { user, loading: authLoading, checkAuth } = useAuth();
  const router = useRouter();
  const params = useParams();
  const employeeId = params?.id as string;
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [currentRoles, setCurrentRoles] = useState<string[]>([]);
  const [employeeRoles, setEmployeeRoles] = useState<string[]>([]);
  const [savingRoles, setSavingRoles] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [passwordResetError, setPasswordResetError] = useState<string | null>(null);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

  // Check role-based access
  const canAccess = user ? canAccessRoute(user.roles, "/admin/employee-profile") : false;
  const canViewOwnProfile = user ? hasFeature(user.roles, "viewOwnProfile") : false;
  const canEditEmployee = user ? hasFeature(user.roles, "editEmployee") : false;
  const canAssignRoles = user ? hasFeature(user.roles, "assignRoles") : false;
  const isSystemAdmin = user ? hasRole(user.roles, SystemRole.SYSTEM_ADMIN) : false;
  const isHRAdmin = user ? hasRole(user.roles, SystemRole.HR_ADMIN) : false;
  const isHRManager = user ? hasRole(user.roles, SystemRole.HR_MANAGER) : false;
  const isFinanceStaff = user ? hasRole(user.roles, SystemRole.FINANCE_STAFF) : false;
  const isLegalPolicyAdmin = user ? hasRole(user.roles, SystemRole.LEGAL_POLICY_ADMIN) : false;
  
  // Check if user is viewing their own profile
  const isViewingOwnProfile = user && employeeId && String(user._id) === String(employeeId);

  useEffect(() => {
    if (!authLoading && user && canAccess && employeeId) {
      fetchEmployee();
    }
  }, [employeeId, user, authLoading, canAccess]);

  // Refresh auth context when viewing own profile to sync profile picture
  useEffect(() => {
    if (isViewingOwnProfile && employee) {
      checkAuth();
    }
  }, [employee?._id, employee?.profilePictureUrl, isViewingOwnProfile]);

  // Load current roles when modal opens
  useEffect(() => {
    if (showRoleModal && employeeId) {
      loadCurrentRoles();
    }
  }, [showRoleModal, employeeId]);

  const loadCurrentRoles = async () => {
    try {
      setLoadingRoles(true);
      setRoleError(null);
      
      // Use the employeeRoles state if available, otherwise try to fetch
      if (employeeRoles.length > 0) {
        setCurrentRoles(employeeRoles);
        setSelectedRoles(employeeRoles);
      } else {
        // Try to fetch roles
        await fetchEmployeeRoles();
        if (employeeRoles.length > 0) {
          setCurrentRoles(employeeRoles);
          setSelectedRoles(employeeRoles);
        } else {
          setCurrentRoles([]);
          setSelectedRoles([]);
        }
      }
    } catch (err: any) {
      console.error("Error loading roles:", err);
      setCurrentRoles([]);
      setSelectedRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(role)) {
        return prev.filter(r => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setPasswordResetError("Password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordResetError("Passwords do not match");
      return;
    }

    try {
      setResettingPassword(true);
      setPasswordResetError(null);
      setPasswordResetSuccess(false);

      await authApi.adminResetPassword(employeeId, {
        newPassword,
        forcePasswordChange,
      });

      setPasswordResetSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
      setForcePasswordChange(false);

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowPasswordResetModal(false);
        setPasswordResetSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error("Error resetting password:", err);
      setPasswordResetError(
        err.response?.data?.message || "Failed to reset password. Please try again."
      );
    } finally {
      setResettingPassword(false);
    }
  };

  const handleSaveRoles = async () => {
    try {
      setSavingRoles(true);
      setRoleError(null);
      
      // Validate that HR Admin is only assigning allowed HR-related roles
      if (isHRAdmin && !isSystemAdmin) {
        const hrAssignableRoles = [
          SystemRole.HR_MANAGER,
          SystemRole.HR_EMPLOYEE,
          SystemRole.RECRUITER
        ];
        const invalidRoles = selectedRoles.filter(role => !hrAssignableRoles.includes(role as SystemRole));
        if (invalidRoles.length > 0) {
          setRoleError(`HR Admin can only assign HR-related roles (HR Manager, HR Employee, Recruiter). Please remove: ${invalidRoles.join(', ')}`);
          setSavingRoles(false);
          return;
        }
      }
      
      const response = await assignEmployeeSystemRoles(employeeId, selectedRoles, [], true);
      
      console.log("Assignment response:", response);
      console.log("Response type:", typeof response);
      console.log("Response.roles:", response?.roles);
      console.log("Response.data:", response?.data);
      
      // Update local roles state from response - the backend returns the full system role object
      let rolesToSet: string[] = [];
      if (response) {
        // Check various possible response structures
        if (Array.isArray(response.roles)) {
          rolesToSet = response.roles;
        } else if (response.data && Array.isArray(response.data.roles)) {
          rolesToSet = response.data.roles;
        } else if (Array.isArray(selectedRoles)) {
          rolesToSet = selectedRoles;
        }
      } else {
        rolesToSet = selectedRoles;
      }
      
      console.log("Setting employee roles to:", rolesToSet);
      setEmployeeRoles(rolesToSet);
      
      // Refresh employee data and roles
      await fetchEmployee();
      // Also fetch roles again to ensure we have the latest
      setTimeout(() => {
        fetchEmployeeRoles();
      }, 200);
      
      setShowRoleModal(false);
      setRoleError(null);
    } catch (err: any) {
      console.error("Error assigning roles:", err);
      setRoleError(err.response?.data?.message || "Failed to assign roles. Please try again.");
    } finally {
      setSavingRoles(false);
    }
  };

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getEmployeeProfileById(employeeId, ['primaryPositionId', 'primaryDepartmentId', 'supervisorPositionId']);
      console.log("Employee profile response:", response);
      setEmployee(response);
      
      // Fetch employee's system roles after setting employee state
      // Use a small delay to ensure employee state is set
      setTimeout(() => {
        fetchEmployeeRoles();
      }, 100);
    } catch (err: any) {
      console.error("Error fetching employee:", err);
      setError(err.response?.data?.message || "Failed to fetch employee profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeRoles = async () => {
    try {
      console.log("Fetching employee roles for:", employeeId);
      
      // First check if employee profile response includes roles
      if (employee && (employee as any).systemRoles && (employee as any).systemRoles.roles) {
        const roles = (employee as any).systemRoles.roles;
        console.log("Found roles in employee.systemRoles:", roles);
        setEmployeeRoles(Array.isArray(roles) ? roles : []);
        return;
      }
      
      // Check if employee object has roles directly
      if (employee && (employee as any).roles) {
        const roles = (employee as any).roles;
        console.log("Found roles in employee.roles:", roles);
        setEmployeeRoles(Array.isArray(roles) ? roles : []);
        return;
      }
      
      // Try to get roles by making a PATCH request with undefined roles
      // This should return existing roles without modifying them
      try {
        console.log("Attempting to fetch roles via PATCH...");
        const rolesRes = await axiosInstance.patch(`/employee-profile/${employeeId}/system-roles`, {
          // Don't send roles - backend will use existing.roles ?? assignDto.roles
          // Since roles is undefined, it will keep existing roles
        });
        console.log("PATCH response:", rolesRes.data);
        if (rolesRes.data && rolesRes.data.roles) {
          const roles = rolesRes.data.roles;
          console.log("Found roles in PATCH response:", roles);
          setEmployeeRoles(Array.isArray(roles) ? roles : []);
          return;
        }
      } catch (err: any) {
        console.warn("Could not fetch roles from PATCH endpoint:", err);
        console.warn("Error details:", err.response?.data);
      }
      
      // If all else fails, set empty array
      console.log("No roles found, setting to empty array");
      setEmployeeRoles([]);
    } catch (err: any) {
      console.error("Error in fetchEmployeeRoles:", err);
      setEmployeeRoles([]);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const statusClasses: { [key: string]: string } = {
      ACTIVE: "bg-green-500/20 text-green-400 border-green-500/30",
      INACTIVE: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      ON_LEAVE: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      SUSPENDED: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      RETIRED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      PROBATION: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      TERMINATED: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return statusClasses[status] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text-muted text-lg">Loading employee profile...</p>
        </div>
      </div>
    );
  }

  return (
    <RouteGuard 
      requiredRoute="/admin/employee-profile" 
      requiredRoles={["System Admin", "HR Admin", "HR Manager", "HR Employee", "Payroll Manager", "Payroll Specialist", "Recruiter", "Legal & Policy Admin", "Finance Staff", "department head", "department employee"]}
    >
      {!user || (!canAccess && !(canViewOwnProfile && isViewingOwnProfile)) ? null : (
        <>
          {error && (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
              <Card className="max-w-md w-full text-center bg-white">
                <CardHeader>
                  <CardTitle className="text-slate-900">Error</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">{error}</p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => router.push("/admin/employee-profile")} variant="outline">
                      Back to List
                    </Button>
                    <Button onClick={fetchEmployee} variant="default">
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {!error && !employee && (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
              <Card className="max-w-md w-full text-center bg-white">
                <CardHeader>
                  <CardTitle className="text-slate-900">Not Found</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">Employee profile not found</p>
                  <Button onClick={() => router.push("/admin/employee-profile")} variant="default">
                    Back to List
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {!error && employee && (
            <div className="min-h-screen bg-slate-50 p-4 md:p-8">
              <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                      Employee Profile
                    </h1>
                    <p className="text-slate-600 text-base md:text-lg">
                      {isSystemAdmin 
                        ? "Full access view - System Administrator" 
                        : isHRAdmin 
                        ? "HR Administration view - HR Admin"
                        : isHRManager
                        ? "HR Management view - HR Manager"
                        : isFinanceStaff
                        ? "Finance view - Read-only finance fields"
                        : isLegalPolicyAdmin
                        ? "Compliance view - Read-only for compliance"
                        : "Employee Profile View"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => router.push("/admin/employee-profile")}
                      variant="outline"
                    >
                      Back to List
                    </Button>
                    {/* Edit Profile Button - System Admin and HR Admin can edit */}
                    {canEditEmployee && (isSystemAdmin || isHRAdmin) && (
                      <Button
                        onClick={() => router.push(`/admin/employee-profile/${employeeId}/edit`)}
                        variant="default"
                      >
                        Edit Profile
                      </Button>
                    )}
                    {/* Assign Roles Button - Only System Admin and HR Admin can assign roles */}
                    {canAssignRoles && (isSystemAdmin || isHRAdmin) && (
                      <Button
                        onClick={() => setShowRoleModal(true)}
                        variant="default"
                      >
                        {isSystemAdmin ? "Assign Roles" : "Assign HR Roles"}
                      </Button>
                    )}
                    {/* Reset Password Button - System Admin only */}
                    {isSystemAdmin && (
                      <Button
                        onClick={() => {
                          setShowPasswordResetModal(true);
                          setPasswordResetError(null);
                          setPasswordResetSuccess(false);
                          setNewPassword("");
                          setConfirmPassword("");
                          setForcePasswordChange(false);
                        }}
                        variant="outline"
                      >
                        Reset Password
                      </Button>
                    )}
                  </div>
                </div>

        {/* Employee Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Legal & Policy Admin sees only compliance-related fields */}
          {isLegalPolicyAdmin ? (
            <>
              {/* Compliance Information */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-slate-900">Compliance Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-slate-600 text-sm">Employee Number</label>
                      <p className="text-slate-900 font-medium">{employee.employeeNumber}</p>
                    </div>
                    <div>
                      <label className="text-slate-600 text-sm">Full Name</label>
                      <p className="text-slate-900 font-medium">
                        {employee.firstName} {employee.middleName} {employee.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="text-slate-600 text-sm">National ID</label>
                      <p className="text-slate-900 font-medium">{employee.nationalId}</p>
                    </div>
                    <div>
                      <label className="text-slate-600 text-sm">Status</label>
                      <div className="mt-1">
                        <span className={`px-3 py-1 rounded text-sm font-medium border ${getStatusBadgeClass(employee.status)}`}>
                          {employee.status}
                        </span>
                      </div>
                    </div>
                    {employee.statusEffectiveFrom && (
                      <div>
                        <label className="text-slate-600 text-sm">Status Effective From</label>
                        <p className="text-slate-900 font-medium">
                          {new Date(employee.statusEffectiveFrom).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-slate-600 text-sm">Work Email</label>
                      <p className="text-slate-900 font-medium">{employee.workEmail || "-"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contract Information */}
              <Card title="Contract Information">
                <div className="space-y-4">
                  <div>
                    <label className="text-text-muted text-sm">Date of Hire</label>
                    <p className="text-text font-medium">
                      {employee.dateOfHire ? new Date(employee.dateOfHire).toLocaleDateString() : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-text-muted text-sm">Contract Type</label>
                    <p className="text-text font-medium">{employee.contractType || "-"}</p>
                  </div>
                  <div>
                    <label className="text-text-muted text-sm">Work Type</label>
                    <p className="text-text font-medium">{employee.workType || "-"}</p>
                  </div>
                  {employee.contractStartDate && (
                    <div>
                      <label className="text-text-muted text-sm">Contract Start Date</label>
                      <p className="text-text font-medium">
                        {new Date(employee.contractStartDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {employee.contractEndDate && (
                    <div>
                      <label className="text-text-muted text-sm">Contract End Date</label>
                      <p className="text-text font-medium">
                        {new Date(employee.contractEndDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Organizational Structure (for compliance) */}
              <Card title="Organizational Structure">
                <div className="space-y-4">
                  <div>
                    <label className="text-text-muted text-sm">Primary Position</label>
                    <p className="text-text font-medium">
                      {employee.primaryPositionId 
                        ? (typeof employee.primaryPositionId === 'object' && employee.primaryPositionId !== null
                            ? `${(employee.primaryPositionId as any).title || (employee.primaryPositionId as any).name || 'N/A'} (${String((employee.primaryPositionId as any)._id || employee.primaryPositionId)})`
                            : String(employee.primaryPositionId))
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-text-muted text-sm">Primary Department</label>
                    <p className="text-text font-medium">
                      {employee.primaryDepartmentId 
                        ? (typeof employee.primaryDepartmentId === 'object' && employee.primaryDepartmentId !== null
                            ? `${(employee.primaryDepartmentId as any).name || 'N/A'} (${String((employee.primaryDepartmentId as any)._id || employee.primaryDepartmentId)})`
                            : String(employee.primaryDepartmentId))
                        : "-"}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Audit Information */}
              <Card title="Audit Information">
                <div className="space-y-4">
                  {employee.createdAt && (
                    <div>
                      <label className="text-text-muted text-sm">Created At</label>
                      <p className="text-text font-medium">
                        {new Date(employee.createdAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {employee.updatedAt && (
                    <div>
                      <label className="text-text-muted text-sm">Last Updated</label>
                      <p className="text-text font-medium">
                        {new Date(employee.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </>
          ) : isFinanceStaff ? (
            <>
              {/* Finance Information */}
              <Card title="Finance Information">
                <div className="space-y-4">
                  <div>
                    <label className="text-text-muted text-sm">Employee Number</label>
                    <p className="text-text font-medium">{employee.employeeNumber}</p>
                  </div>
                  <div>
                    <label className="text-text-muted text-sm">Status</label>
                    <div className="mt-1">
                      <span className={`px-3 py-1 rounded text-sm font-medium border ${getStatusBadgeClass(employee.status)}`}>
                        {employee.status}
                      </span>
                    </div>
                  </div>
                  {employee.statusEffectiveFrom && (
                    <div>
                      <label className="text-text-muted text-sm">Status Effective From</label>
                      <p className="text-text font-medium">
                        {new Date(employee.statusEffectiveFrom).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-text-muted text-sm">Date of Hire</label>
                    <p className="text-text font-medium">
                      {employee.dateOfHire ? new Date(employee.dateOfHire).toLocaleDateString() : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-text-muted text-sm">Contract Type</label>
                    <p className="text-text font-medium">{employee.contractType || "-"}</p>
                  </div>
                  {employee.contractStartDate && (
                    <div>
                      <label className="text-text-muted text-sm">Contract Start Date</label>
                      <p className="text-text font-medium">
                        {new Date(employee.contractStartDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {employee.contractEndDate && (
                    <div>
                      <label className="text-text-muted text-sm">Contract End Date</label>
                      <p className="text-text font-medium">
                        {new Date(employee.contractEndDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Banking Information */}
              <Card title="Banking Information">
                <div className="space-y-4">
                  <div>
                    <label className="text-text-muted text-sm">Bank Name</label>
                    <p className="text-text font-medium">{employee.bankName || "-"}</p>
                  </div>
                  <div>
                    <label className="text-text-muted text-sm">Bank Account Number</label>
                    <p className="text-text font-medium">{employee.bankAccountNumber || "-"}</p>
                  </div>
                </div>
              </Card>

              {/* Organizational Structure (for budget planning and cost allocation) */}
              <Card title="Organizational Structure">
                <div className="space-y-4">
                  <div>
                    <label className="text-text-muted text-sm">Primary Position</label>
                    <p className="text-text font-medium">
                      {employee.primaryPositionId 
                        ? (typeof employee.primaryPositionId === 'object' && employee.primaryPositionId !== null
                            ? `${(employee.primaryPositionId as any).title || (employee.primaryPositionId as any).name || 'N/A'} (${String((employee.primaryPositionId as any)._id || employee.primaryPositionId)})`
                            : String(employee.primaryPositionId))
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-text-muted text-sm">Primary Department</label>
                    <p className="text-text font-medium">
                      {employee.primaryDepartmentId 
                        ? (typeof employee.primaryDepartmentId === 'object' && employee.primaryDepartmentId !== null
                            ? `${(employee.primaryDepartmentId as any).name || 'N/A'} (${String((employee.primaryDepartmentId as any)._id || employee.primaryDepartmentId)})`
                            : String(employee.primaryDepartmentId))
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-text-muted text-sm">Pay Grade ID</label>
                    <p className="text-text font-medium">
                      {employee.payGradeId 
                        ? (typeof employee.payGradeId === 'object' && employee.payGradeId !== null
                            ? String((employee.payGradeId as any)._id || employee.payGradeId)
                            : String(employee.payGradeId))
                        : "-"}
                    </p>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <>
              {/* Basic Information */}
              <Card title="Basic Information">
                <div className="space-y-4">
                  <div>
                    <label className="text-text-muted text-sm">Employee Number</label>
                    <p className="text-text font-medium">{employee.employeeNumber}</p>
                  </div>
                  <div>
                    <label className="text-text-muted text-sm">Full Name</label>
                    <p className="text-text font-medium">
                      {employee.firstName} {employee.middleName} {employee.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="text-text-muted text-sm">National ID</label>
                    <p className="text-text font-medium">{employee.nationalId}</p>
                  </div>
                  <div>
                    <label className="text-text-muted text-sm">Status</label>
                    <div className="mt-1">
                      <span className={`px-3 py-1 rounded text-sm font-medium border ${getStatusBadgeClass(employee.status)}`}>
                        {employee.status}
                      </span>
                    </div>
                  </div>
                  {employee.statusEffectiveFrom && (
                    <div>
                      <label className="text-text-muted text-sm">Status Effective From</label>
                      <p className="text-text font-medium">
                        {new Date(employee.statusEffectiveFrom).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Contact Information */}
              <Card title="Contact Information">
                <div className="space-y-4">
                  <div>
                    <label className="text-text-muted text-sm">Work Email</label>
                    <p className="text-text font-medium">{employee.workEmail || "-"}</p>
                  </div>
                  <div>
                    <label className="text-text-muted text-sm">Personal Email</label>
                    <p className="text-text font-medium">{employee.personalEmail || "-"}</p>
                  </div>
                  <div>
                    <label className="text-text-muted text-sm">Mobile Phone</label>
                    <p className="text-text font-medium">{employee.mobilePhone || "-"}</p>
                  </div>
                  <div>
                    <label className="text-text-muted text-sm">Home Phone</label>
                    <p className="text-text font-medium">{employee.homePhone || "-"}</p>
                  </div>
                  {employee.address && (
                    <div>
                      <label className="text-text-muted text-sm">Address</label>
                      <p className="text-text font-medium">
                        {employee.address.streetAddress || ""}
                        {employee.address.city && `, ${employee.address.city}`}
                        {employee.address.country && `, ${employee.address.country}`}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Employment Information */}
              <Card title="Employment Information">
                <div className="space-y-4">
                  <div>
                    <label className="text-text-muted text-sm">Date of Hire</label>
                    <p className="text-text font-medium">
                      {employee.dateOfHire ? new Date(employee.dateOfHire).toLocaleDateString() : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-text-muted text-sm">Contract Type</label>
                    <p className="text-text font-medium">{employee.contractType || "-"}</p>
                  </div>
                  <div>
                    <label className="text-text-muted text-sm">Work Type</label>
                    <p className="text-text font-medium">{employee.workType || "-"}</p>
                  </div>
                  {employee.contractStartDate && (
                    <div>
                      <label className="text-text-muted text-sm">Contract Start Date</label>
                      <p className="text-text font-medium">
                        {new Date(employee.contractStartDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {employee.contractEndDate && (
                    <div>
                      <label className="text-text-muted text-sm">Contract End Date</label>
                      <p className="text-text font-medium">
                        {new Date(employee.contractEndDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Personal Information */}
              <Card title="Personal Information">
                <div className="space-y-4">
                  {employee.dateOfBirth && (
                    <div>
                      <label className="text-text-muted text-sm">Date of Birth</label>
                      <p className="text-text font-medium">
                        {new Date(employee.dateOfBirth).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-text-muted text-sm">Gender</label>
                    <p className="text-text font-medium">{employee.gender || "-"}</p>
                  </div>
                  <div>
                    <label className="text-text-muted text-sm">Marital Status</label>
                    <p className="text-text font-medium">{employee.maritalStatus || "-"}</p>
                  </div>
                  {employee.profilePictureUrl && (
                    <div>
                      <label className="text-text-muted text-sm">Profile Picture</label>
                      <div className="mt-2">
                        <img
                          src={employee.profilePictureUrl}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover border border-border"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Organizational Links */}
              <Card title="Organizational Structure">
                <div className="space-y-4">
                  <div>
                    <label className="text-text-muted text-sm">Primary Position</label>
                    <p className="text-text font-medium">
                      {employee.primaryPositionId 
                        ? (typeof employee.primaryPositionId === 'object' && employee.primaryPositionId !== null
                            ? `${(employee.primaryPositionId as any).title || (employee.primaryPositionId as any).name || 'N/A'} (${String((employee.primaryPositionId as any)._id || employee.primaryPositionId)})`
                            : String(employee.primaryPositionId))
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-text-muted text-sm">Primary Department</label>
                    <p className="text-text font-medium">
                      {employee.primaryDepartmentId 
                        ? (typeof employee.primaryDepartmentId === 'object' && employee.primaryDepartmentId !== null
                            ? `${(employee.primaryDepartmentId as any).name || 'N/A'} (${String((employee.primaryDepartmentId as any)._id || employee.primaryDepartmentId)})`
                            : String(employee.primaryDepartmentId))
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-text-muted text-sm">Supervisor Position</label>
                    <p className="text-text font-medium">
                      {employee.supervisorPositionId 
                        ? (typeof employee.supervisorPositionId === 'object' && employee.supervisorPositionId !== null
                            ? `${(employee.supervisorPositionId as any).title || (employee.supervisorPositionId as any).name || 'N/A'} (${String((employee.supervisorPositionId as any)._id || employee.supervisorPositionId)})`
                            : String(employee.supervisorPositionId))
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-text-muted text-sm">Pay Grade ID</label>
                    <p className="text-text font-medium">
                      {employee.payGradeId 
                        ? (typeof employee.payGradeId === 'object' && employee.payGradeId !== null
                            ? String((employee.payGradeId as any)._id || employee.payGradeId)
                            : String(employee.payGradeId))
                        : "-"}
                    </p>
                  </div>
                </div>
              </Card>

              {/* System Roles */}
              <Card title="System Roles">
                <div className="space-y-4">
                  {employeeRoles.length > 0 ? (
                    <div>
                      <label className="text-text-muted text-sm">Assigned Roles</label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {employeeRoles.map((role, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-md text-sm font-medium border border-blue-500/30"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-text-muted text-sm">No system roles assigned</p>
                      <p className="text-text-muted text-xs mt-1">Use the "Assign Roles" button to assign system roles to this employee.</p>
                    </div>
                  )}
                  {/* Debug info - remove in production */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-2 p-2 bg-gray-800 rounded text-xs text-gray-400">
                      <p>Debug: employeeRoles state = {JSON.stringify(employeeRoles)}</p>
                      <p>employeeRoles.length = {employeeRoles.length}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Additional Information */}
              <Card title="Additional Information">
                <div className="space-y-4">
                  {employee.biography && (
                    <div>
                      <label className="text-text-muted text-sm">Biography</label>
                      <p className="text-text font-medium whitespace-pre-wrap">{employee.biography}</p>
                    </div>
                  )}
                  {employee.permissions && employee.permissions.length > 0 && (
                    <div>
                      <label className="text-text-muted text-sm">Permissions</label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {employee.permissions.map((permission, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-primary/20 text-primary rounded text-xs border border-primary/30"
                          >
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {employee.createdAt && (
                    <div>
                      <label className="text-text-muted text-sm">Created At</label>
                      <p className="text-text font-medium">
                        {new Date(employee.createdAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {employee.updatedAt && (
                    <div>
                      <label className="text-text-muted text-sm">Last Updated</label>
                      <p className="text-text font-medium">
                        {new Date(employee.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
          )}
        </>
      )}

      {/* Role Assignment Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-text">Assign System Roles</h2>
                <button
                  onClick={() => {
                    setShowRoleModal(false);
                    setRoleError(null);
                  }}
                  className="text-text-muted hover:text-text text-2xl"
                >
                  ×
                </button>
              </div>

              {roleError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-sm">
                  {roleError}
                </div>
              )}

              <div className="mb-4">
                <p className="text-text-muted text-sm mb-2">
                  Select system roles to assign to <strong className="text-text">{employee?.firstName} {employee?.lastName}</strong>
                </p>
                {isHRAdmin && !isSystemAdmin && (
                  <p className="text-yellow-400 text-xs mb-2">
                    ⚠️ As HR Admin, you can only assign HR-related roles: HR Manager, HR Employee, and Recruiter. System Admin must assign all other roles.
                  </p>
                )}
              </div>

              {loadingRoles ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                  <p className="text-text-muted text-sm">Loading current roles...</p>
                </div>
              ) : (
                <div className="space-y-2 mb-6">
                  {Object.values(SystemRole).map((role) => {
                    // HR Admin can only assign: HR Manager, HR Employee, Recruiter
                    // System Admin can assign all roles
                    const hrAssignableRoles = [
                      SystemRole.HR_MANAGER,
                      SystemRole.HR_EMPLOYEE,
                      SystemRole.RECRUITER
                    ];
                    const isDisabled = isHRAdmin && !isSystemAdmin && !hrAssignableRoles.includes(role);
                    const isChecked = selectedRoles.includes(role);
                    
                    return (
                      <label
                        key={role}
                        className={`flex items-center p-3 rounded border cursor-pointer transition-colors ${
                          isDisabled
                            ? 'bg-gray-500/10 border-gray-500/20 cursor-not-allowed opacity-50'
                            : isChecked
                            ? 'bg-primary/20 border-primary/50'
                            : 'bg-background-light border-border hover:border-primary/30'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => !isDisabled && handleRoleToggle(role)}
                          disabled={isDisabled}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-primary focus:ring-2"
                        />
                        <span className={`ml-3 text-sm ${isDisabled ? 'text-text-muted' : 'text-text'}`}>
                          {role}
                          {isDisabled && (
                            <span className="ml-2 text-xs text-yellow-400">(Restricted)</span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {currentRoles.length > 0 && (
                <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                  <p className="text-blue-400 text-xs font-semibold mb-1">Current Roles:</p>
                  <div className="flex flex-wrap gap-2">
                    {currentRoles.map((role) => (
                      <span
                        key={role}
                        className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs border border-blue-500/30"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => {
                    setShowRoleModal(false);
                    setRoleError(null);
                  }}
                  variant="outline"
                  disabled={savingRoles}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveRoles}
                  variant="default"
                  disabled={savingRoles}
                >
                  {savingRoles ? "Saving..." : "Save Roles"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-text">Reset Password</h2>
                <button
                  onClick={() => {
                    setShowPasswordResetModal(false);
                    setPasswordResetError(null);
                    setPasswordResetSuccess(false);
                    setNewPassword("");
                    setConfirmPassword("");
                    setForcePasswordChange(false);
                  }}
                  className="text-text-muted hover:text-text text-2xl"
                >
                  ×
                </button>
              </div>

              {passwordResetSuccess && (
                <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded text-green-400 text-sm">
                  Password reset successfully! The employee can now login with the new password.
                </div>
              )}

              {passwordResetError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-sm">
                  {passwordResetError}
                </div>
              )}

              <div className="mb-4">
                <p className="text-text-muted text-sm mb-4">
                  Reset password for <strong className="text-text">{employee?.firstName} {employee?.lastName}</strong> ({employee?.employeeNumber})
                </p>
                <p className="text-yellow-400 text-xs mb-4">
                  ⚠️ The employee will need to use this new password to login. Make sure to communicate the new password securely.
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 8 characters)"
                  required
                  disabled={resettingPassword}
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  disabled={resettingPassword}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="forcePasswordChange"
                    checked={forcePasswordChange}
                    onChange={(e) => setForcePasswordChange(e.target.checked)}
                    disabled={resettingPassword}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary focus:ring-2"
                  />
                  <label htmlFor="forcePasswordChange" className="text-text text-sm cursor-pointer">
                    Force password change on next login
                  </label>
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <Button
                  onClick={() => {
                    setShowPasswordResetModal(false);
                    setPasswordResetError(null);
                    setPasswordResetSuccess(false);
                    setNewPassword("");
                    setConfirmPassword("");
                    setForcePasswordChange(false);
                  }}
                  variant="outline"
                  disabled={resettingPassword}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleResetPassword}
                  variant="default"
                  disabled={resettingPassword || !newPassword || !confirmPassword}
                  isLoading={resettingPassword}
                >
                  {resettingPassword ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </RouteGuard>
  );
}

