"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import RouteGuard from "@/components/RouteGuard";
import { getEmployeeProfileById, updateEmployeeProfile, EmployeeProfile } from "@/utils/employeeProfileApi";
import { canAccessRoute, hasFeature, hasRole, SystemRole } from "@/utils/roleAccess";
import { getAllDepartments, getAllPositions, Department, Position } from "@/utils/organizationStructureApi";
import { authApi } from "@/utils/authApi";

export default function EmployeeProfileEditPage() {
  const { user, loading: authLoading, checkAuth } = useAuth();
  const router = useRouter();
  const params = useParams();
  const employeeId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<EmployeeProfile>>({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loadingOrgData, setLoadingOrgData] = useState(false);

  // Check role-based access - only users who can edit employees
  const canEditEmployee = user ? hasFeature(user.roles, "editEmployee") : false;
  const canAccess = user ? canAccessRoute(user.roles, "/admin/employee-profile") : false;
  const isSystemAdmin = user ? hasRole(user.roles, SystemRole.SYSTEM_ADMIN) : false;
  const isPayrollManager = user ? hasRole(user.roles, SystemRole.PAYROLL_MANAGER) : false;
  
  // Password reset state
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [passwordResetError, setPasswordResetError] = useState<string | null>(null);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && user && (canEditEmployee || isPayrollManager) && canAccess && employeeId) {
      fetchEmployee();
      // Only load organizational data if not a Payroll Manager
      if (!isPayrollManager) {
        loadOrganizationalData();
      }
    }
  }, [employeeId, user, authLoading, canEditEmployee, canAccess, isPayrollManager]);

  const loadOrganizationalData = async () => {
    try {
      setLoadingOrgData(true);
      const [deptsRes, positionsRes] = await Promise.all([
        getAllDepartments(),
        getAllPositions()
      ]);
      
      // API returns arrays directly
      const depts = Array.isArray(deptsRes) ? deptsRes : [];
      const pos = Array.isArray(positionsRes) ? positionsRes : [];
      
      console.log("Loaded departments:", depts.length, depts);
      console.log("Loaded positions:", pos.length, pos);
      
      setDepartments(depts);
      setPositions(pos);
    } catch (err: any) {
      console.error("Error loading organizational data:", err);
      setError("Failed to load organizational structure data. Please refresh the page.");
    } finally {
      setLoadingOrgData(false);
    }
  };

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getEmployeeProfileById(employeeId);
      
      // Normalize organizational structure IDs - handle both populated objects and string IDs
      const normalizedData = { ...response };
      if (response.primaryDepartmentId) {
        normalizedData.primaryDepartmentId = typeof response.primaryDepartmentId === 'object' 
          ? String(response.primaryDepartmentId._id || response.primaryDepartmentId)
          : String(response.primaryDepartmentId);
      }
      if (response.primaryPositionId) {
        normalizedData.primaryPositionId = typeof response.primaryPositionId === 'object' 
          ? String(response.primaryPositionId._id || response.primaryPositionId)
          : String(response.primaryPositionId);
      }
      if (response.supervisorPositionId) {
        normalizedData.supervisorPositionId = typeof response.supervisorPositionId === 'object' 
          ? String(response.supervisorPositionId._id || response.supervisorPositionId)
          : String(response.supervisorPositionId);
      }
      if (response.payGradeId) {
        normalizedData.payGradeId = typeof response.payGradeId === 'object' 
          ? String(response.payGradeId._id || response.payGradeId)
          : String(response.payGradeId);
      }
      
      setFormData(normalizedData);
    } catch (err: any) {
      console.error("Error fetching employee:", err);
      setError(err.response?.data?.message || "Failed to fetch employee profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      
      // For Payroll Managers, only allow payroll-related fields
      if (isPayrollManager) {
        // Filter out MongoDB internal fields
        const { _id, __v, createdAt, updatedAt, ...allData } = formData as any;
        
        // Only allow payroll-related fields (Contract Type, Work Type, Contract Dates are view-only)
        const allowedPayrollFields = [
          'bankName',
          'bankAccountNumber',
          'payGradeId'
        ];
        
        const updateData: any = {};
        for (const field of allowedPayrollFields) {
          if (allData[field] !== undefined) {
            updateData[field] = allData[field];
          }
        }
        
        // Handle payGradeId if it's an object
        if (updateData.payGradeId && typeof updateData.payGradeId === 'object' && '_id' in updateData.payGradeId) {
          updateData.payGradeId = String((updateData.payGradeId as any)._id || updateData.payGradeId);
        }
        
        // Only send payGradeId in orgLinks if it exists
        let orgLinks: any = undefined;
        if (updateData.payGradeId) {
          const payId = String(updateData.payGradeId).trim();
          if (payId && payId !== '') {
            orgLinks = { payGradeId: payId };
            delete updateData.payGradeId; // Remove from updateData since it goes in orgLinks
          }
        }
        
        const finalUpdateData = orgLinks ? { ...updateData, orgLinks } : updateData;
        
        console.log("Payroll Manager - Sending update data:", finalUpdateData);
        
        await updateEmployeeProfile(employeeId, finalUpdateData);
        router.push(`/admin/employee-profile/${employeeId}`);
        return;
      }
      
      // For System Admin and HR Admin - full edit access
      // Extract organizational IDs before filtering
      const primaryPositionId = formData.primaryPositionId;
      const primaryDepartmentId = formData.primaryDepartmentId;
      const supervisorPositionId = formData.supervisorPositionId;
      const payGradeId = formData.payGradeId;
      
      // Validate required fields
      if (!primaryDepartmentId || (typeof primaryDepartmentId === 'string' && primaryDepartmentId.trim() === '')) {
        setError("Primary Department is required");
        setSaving(false);
        return;
      }
      if (!primaryPositionId || (typeof primaryPositionId === 'string' && primaryPositionId.trim() === '')) {
        setError("Primary Position is required");
        setSaving(false);
        return;
      }
      
      // Filter out MongoDB internal fields before sending update
      const { _id, __v, createdAt, updatedAt, ...updateData } = formData as any;
      // Remove org structure fields from updateData since we'll send them in orgLinks
      delete updateData.primaryPositionId;
      delete updateData.primaryDepartmentId;
      delete updateData.supervisorPositionId;
      delete updateData.payGradeId;
      
      // Build orgLinks object - primaryDepartmentId and primaryPositionId are mandatory
      // Ensure we convert to strings and handle empty strings properly
      const deptId = primaryDepartmentId && typeof primaryDepartmentId === 'object' && '_id' in primaryDepartmentId
        ? String((primaryDepartmentId as any)._id || primaryDepartmentId)
        : primaryDepartmentId
        ? String(primaryDepartmentId).trim()
        : '';
      
      const posId = primaryPositionId && typeof primaryPositionId === 'object' && '_id' in primaryPositionId
        ? String((primaryPositionId as any)._id || primaryPositionId)
        : primaryPositionId
        ? String(primaryPositionId).trim()
        : '';
      
      if (!deptId || deptId === '') {
        setError("Primary Department is required");
        setSaving(false);
        return;
      }
      if (!posId || posId === '') {
        setError("Primary Position is required");
        setSaving(false);
        return;
      }
      
      const orgLinks: any = {
        primaryDepartmentId: deptId,
        primaryPositionId: posId,
      };
      
      // Optional fields - only include if they have values
      if (supervisorPositionId) {
        const supId = typeof supervisorPositionId === 'object' && supervisorPositionId && '_id' in supervisorPositionId
          ? String((supervisorPositionId as any)._id || supervisorPositionId)
          : String(supervisorPositionId).trim();
        if (supId && supId !== '') {
          orgLinks.supervisorPositionId = supId;
        }
      }
      if (payGradeId) {
        const payId = typeof payGradeId === 'object' && payGradeId && '_id' in payGradeId
          ? String((payGradeId as any)._id || payGradeId)
          : String(payGradeId).trim();
        if (payId && payId !== '') {
          orgLinks.payGradeId = payId;
        }
      }
      
      console.log("Sending orgLinks:", orgLinks);
      console.log("Position ID being sent:", posId);
      console.log("Department ID being sent:", deptId);
      
      // Include orgLinks in update data
      const finalUpdateData = { ...updateData, orgLinks };
      
      await updateEmployeeProfile(employeeId, finalUpdateData);
      
      // If user is updating their own profile, refresh auth context to sync profile picture
      if (user && String(user._id) === String(employeeId)) {
        await checkAuth();
      }
      
      router.push(`/admin/employee-profile/${employeeId}`);
    } catch (err: any) {
      console.error("Error updating employee:", err);
      setError(err.response?.data?.message || "Failed to update employee profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-600 text-lg">Loading employee profile...</p>
        </div>
      </div>
    );
  }

  if (!user || (!canEditEmployee && !isPayrollManager) || !canAccess) {
    return (
      <RouteGuard requiredRoute="/admin/employee-profile" requiredRoles={["System Admin", "HR Admin", "Payroll Manager"]}>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
          <Card className="max-w-md w-full text-center bg-white">
            <CardHeader>
              <CardTitle className="text-slate-900">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                You do not have permission to edit employee profiles.
              </p>
              <Button onClick={() => router.push("/admin/employee-profile")} variant="default">
                Back to Employee List
              </Button>
            </CardContent>
          </Card>
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard requiredRoute="/admin/employee-profile" requiredRoles={["System Admin", "HR Admin", "Payroll Manager"]}>
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Edit Employee Profile
            </h1>
            <p className="text-slate-600 text-base md:text-lg">
              {user && hasRole(user.roles, SystemRole.SYSTEM_ADMIN) 
                ? "Update/override profile data - System Administrator"
                : isPayrollManager
                ? "Update employee payroll data - Payroll Manager"
                : "Update employee profile data - HR Admin"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push(`/admin/employee-profile/${employeeId}`)}
              variant="outline"
            >
              Cancel
            </Button>
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

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payroll Fields for Payroll Manager */}
            {isPayrollManager ? (
              <>
                {/* Banking Information */}
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="text-slate-900">Banking Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input
                          id="bankName"
                          value={formData.bankName || ""}
                          onChange={(e) => handleInputChange("bankName", e.target.value)}
                          placeholder="Enter bank name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                        <Input
                          id="bankAccountNumber"
                          value={formData.bankAccountNumber || ""}
                          onChange={(e) => handleInputChange("bankAccountNumber", e.target.value)}
                          placeholder="Enter bank account number"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Employment Information - Payroll Fields Only */}
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="text-slate-900">Employment & Payroll Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* View-only fields */}
                      <div className="space-y-2">
                        <Label htmlFor="contractType">Contract Type (View Only)</Label>
                        <Input
                          id="contractType"
                          value={formData.contractType || "-"}
                          disabled
                          className="bg-slate-100 cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="workType">Work Type (View Only)</Label>
                        <Input
                          id="workType"
                          value={formData.workType || "-"}
                          disabled
                          className="bg-slate-100 cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contractStartDate">Contract Start Date (View Only)</Label>
                        <Input
                          id="contractStartDate"
                          type="date"
                          value={formData.contractStartDate ? new Date(formData.contractStartDate).toISOString().split('T')[0] : ""}
                          disabled
                          className="bg-slate-100 cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contractEndDate">Contract End Date (View Only)</Label>
                        <Input
                          id="contractEndDate"
                          type="date"
                          value={formData.contractEndDate ? new Date(formData.contractEndDate).toISOString().split('T')[0] : ""}
                          disabled
                          className="bg-slate-100 cursor-not-allowed"
                        />
                      </div>
                      {/* Editable field */}
                      <div className="space-y-2">
                        <Label htmlFor="payGradeId">Pay Grade ID</Label>
                        <Input
                          id="payGradeId"
                          value={formData.payGradeId && typeof formData.payGradeId === 'object' && '_id' in formData.payGradeId
                            ? String((formData.payGradeId as any)._id || formData.payGradeId)
                            : String(formData.payGradeId || "")}
                          onChange={(e) => handleInputChange("payGradeId", e.target.value || undefined)}
                          placeholder="Enter Pay Grade ID"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                {/* Basic Information */}
                <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-slate-900">Basic Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeNumber">Employee Number</Label>
                    <Input
                      id="employeeNumber"
                      value={formData.employeeNumber || ""}
                      onChange={(e) => handleInputChange("employeeNumber", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName || ""}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input
                      id="middleName"
                      value={formData.middleName || ""}
                      onChange={(e) => handleInputChange("middleName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName || ""}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationalId">National ID</Label>
                    <Input
                      id="nationalId"
                      value={formData.nationalId || ""}
                      onChange={(e) => handleInputChange("nationalId", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.status || ""}
                      onChange={(e) => handleInputChange("status", e.target.value)}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="ON_LEAVE">On Leave</option>
                      <option value="SUSPENDED">Suspended</option>
                      <option value="RETIRED">Retired</option>
                      <option value="PROBATION">Probation</option>
                      <option value="TERMINATED">Terminated</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-slate-900">Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="workEmail">Work Email</Label>
                    <Input
                      id="workEmail"
                      type="email"
                      value={formData.workEmail || ""}
                      onChange={(e) => handleInputChange("workEmail", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="personalEmail">Personal Email</Label>
                    <Input
                      id="personalEmail"
                      type="email"
                      value={formData.personalEmail || ""}
                      onChange={(e) => handleInputChange("personalEmail", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobilePhone">Mobile Phone</Label>
                    <Input
                      id="mobilePhone"
                      value={formData.mobilePhone || ""}
                      onChange={(e) => handleInputChange("mobilePhone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="homePhone">Home Phone</Label>
                    <Input
                      id="homePhone"
                      value={formData.homePhone || ""}
                      onChange={(e) => handleInputChange("homePhone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profilePictureUrl">Profile Picture URL</Label>
                    <Input
                      id="profilePictureUrl"
                      value={formData.profilePictureUrl || ""}
                      onChange={(e) => handleInputChange("profilePictureUrl", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-slate-900">Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="streetAddress">Street Address</Label>
                    <Input
                      id="streetAddress"
                      value={formData.address?.streetAddress || ""}
                      onChange={(e) => handleAddressChange("streetAddress", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.address?.city || ""}
                      onChange={(e) => handleAddressChange("city", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.address?.country || ""}
                      onChange={(e) => handleAddressChange("country", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employment Information */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-slate-900">Employment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfHire">Date of Hire</Label>
                    <Input
                      id="dateOfHire"
                      type="date"
                      value={formData.dateOfHire ? new Date(formData.dateOfHire).toISOString().split('T')[0] : ""}
                      onChange={(e) => handleInputChange("dateOfHire", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contractType">Contract Type</Label>
                    <select
                      id="contractType"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.contractType || ""}
                      onChange={(e) => handleInputChange("contractType", e.target.value)}
                    >
                      <option value="">Select Contract Type</option>
                      <option value="FULL_TIME_CONTRACT">Full Time Contract</option>
                      <option value="PART_TIME_CONTRACT">Part Time Contract</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workType">Work Type</Label>
                    <select
                      id="workType"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.workType || ""}
                      onChange={(e) => handleInputChange("workType", e.target.value)}
                    >
                      <option value="">Select Work Type</option>
                      <option value="FULL_TIME">Full Time</option>
                      <option value="PART_TIME">Part Time</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contractStartDate">Contract Start Date</Label>
                    <Input
                      id="contractStartDate"
                      type="date"
                      value={formData.contractStartDate ? new Date(formData.contractStartDate).toISOString().split('T')[0] : ""}
                      onChange={(e) => handleInputChange("contractStartDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contractEndDate">Contract End Date</Label>
                    <Input
                      id="contractEndDate"
                      type="date"
                      value={formData.contractEndDate ? new Date(formData.contractEndDate).toISOString().split('T')[0] : ""}
                      onChange={(e) => handleInputChange("contractEndDate", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-slate-900">Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split('T')[0] : ""}
                      onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.gender || ""}
                      onChange={(e) => handleInputChange("gender", e.target.value)}
                    >
                      <option value="">Select Gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    <select
                      id="maritalStatus"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.maritalStatus || ""}
                      onChange={(e) => handleInputChange("maritalStatus", e.target.value)}
                    >
                      <option value="">Select Marital Status</option>
                      <option value="SINGLE">Single</option>
                      <option value="MARRIED">Married</option>
                      <option value="DIVORCED">Divorced</option>
                      <option value="WIDOWED">Widowed</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-slate-900">Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="biography">Biography</Label>
                    <textarea
                      id="biography"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                      value={formData.biography || ""}
                      onChange={(e) => handleInputChange("biography", e.target.value)}
                      placeholder="Enter biography..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="statusEffectiveFrom">Status Effective From</Label>
                    <Input
                      id="statusEffectiveFrom"
                      type="date"
                      value={formData.statusEffectiveFrom ? new Date(formData.statusEffectiveFrom).toISOString().split('T')[0] : ""}
                      onChange={(e) => handleInputChange("statusEffectiveFrom", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Organizational Links */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-slate-900">Organizational Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loadingOrgData ? (
                    <div className="text-center py-4">
                      <p className="text-slate-600">Loading departments and positions...</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="primaryDepartmentId">
                          Primary Department <span className="text-red-600">*</span>
                        </Label>
                        <select
                          id="primaryDepartmentId"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.primaryDepartmentId && typeof formData.primaryDepartmentId === 'object' && '_id' in formData.primaryDepartmentId
                            ? String((formData.primaryDepartmentId as any)._id || formData.primaryDepartmentId)
                            : String(formData.primaryDepartmentId || "")}
                          onChange={(e) => handleInputChange("primaryDepartmentId", e.target.value || undefined)}
                          required
                          disabled={loadingOrgData}
                        >
                          <option value="">Select Department</option>
                          {departments.length > 0 ? (
                            departments
                              .filter(dept => dept.isActive !== false)
                              .map((dept) => (
                                <option key={dept._id} value={dept._id}>
                                  {dept.name} {dept.code ? `(${dept.code})` : ''}
                                </option>
                              ))
                          ) : (
                            <option value="" disabled>No departments available</option>
                          )}
                        </select>
                        {departments.length === 0 && !loadingOrgData && (
                          <p className="text-xs text-slate-600 mt-1">No departments found. Please create departments first.</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="primaryPositionId">
                          Primary Position <span className="text-red-600">*</span>
                        </Label>
                        <select
                          id="primaryPositionId"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.primaryPositionId && typeof formData.primaryPositionId === 'object' && '_id' in formData.primaryPositionId
                            ? String((formData.primaryPositionId as any)._id || formData.primaryPositionId)
                            : String(formData.primaryPositionId || "")}
                          onChange={(e) => handleInputChange("primaryPositionId", e.target.value || undefined)}
                          required
                          disabled={loadingOrgData}
                        >
                          <option value="">Select Position</option>
                          {positions.length > 0 ? (
                            positions
                              .filter(pos => pos.isActive !== false)
                              .map((pos) => (
                                <option key={pos._id} value={pos._id}>
                                  {pos.title} {pos.code ? `(${pos.code})` : ''}
                                </option>
                              ))
                          ) : (
                            <option value="" disabled>No positions available</option>
                          )}
                        </select>
                        {positions.length === 0 && !loadingOrgData && (
                          <p className="text-xs text-slate-600 mt-1">No positions found. Please create positions first.</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="supervisorPositionId">Supervisor Position</Label>
                        <select
                          id="supervisorPositionId"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.supervisorPositionId && typeof formData.supervisorPositionId === 'object' && '_id' in formData.supervisorPositionId
                            ? String((formData.supervisorPositionId as any)._id || formData.supervisorPositionId)
                            : String(formData.supervisorPositionId || "")}
                          onChange={(e) => handleInputChange("supervisorPositionId", e.target.value || undefined)}
                          disabled={loadingOrgData}
                        >
                          <option value="">Select Supervisor Position</option>
                          {positions.length > 0 ? (
                            positions
                              .filter(pos => pos.isActive !== false)
                              .map((pos) => (
                                <option key={pos._id} value={pos._id}>
                                  {pos.title} {pos.code ? `(${pos.code})` : ''}
                                </option>
                              ))
                          ) : (
                            <option value="" disabled>No positions available</option>
                          )}
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="payGradeId">Pay Grade ID</Label>
                        <Input
                          id="payGradeId"
                          value={formData.payGradeId && typeof formData.payGradeId === 'object' && '_id' in formData.payGradeId
                            ? String((formData.payGradeId as any)._id || formData.payGradeId)
                            : String(formData.payGradeId || "")}
                          onChange={(e) => handleInputChange("payGradeId", e.target.value || undefined)}
                          placeholder="Enter Pay Grade ID"
                        />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
              </>
            )}
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex justify-end gap-4">
            <Button
              type="button"
              onClick={() => router.push(`/admin/employee-profile/${employeeId}`)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>

    {/* Password Reset Modal */}
    {showPasswordResetModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white border border-slate-200 rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Reset Password</h2>
              <button
                onClick={() => {
                  setShowPasswordResetModal(false);
                  setPasswordResetError(null);
                  setPasswordResetSuccess(false);
                  setNewPassword("");
                  setConfirmPassword("");
                  setForcePasswordChange(false);
                }}
                className="text-slate-600 hover:text-slate-900 text-2xl"
              >
                ×
              </button>
            </div>

            {passwordResetSuccess && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded text-green-600 text-sm">
                Password reset successfully! The employee can now login with the new password.
              </div>
            )}

            {passwordResetError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded text-red-600 text-sm">
                {passwordResetError}
              </div>
            )}

            <div className="mb-4">
              <p className="text-slate-600 text-sm mb-4">
                Reset password for <strong className="text-slate-900">{formData.firstName} {formData.lastName}</strong> ({formData.employeeNumber})
              </p>
              <p className="text-yellow-600 text-xs mb-4">
                ⚠️ The employee will need to use this new password to login. Make sure to communicate the new password securely.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password *</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 8 characters)"
                  required
                  disabled={resettingPassword}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  disabled={resettingPassword}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="forcePasswordChange"
                  checked={forcePasswordChange}
                  onChange={(e) => setForcePasswordChange(e.target.checked)}
                  disabled={resettingPassword}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="forcePasswordChange" className="text-slate-900 text-sm cursor-pointer">
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

