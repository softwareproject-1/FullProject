"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import RouteGuard from "@/components/RouteGuard";
import { createEmployeeProfile, EmployeeProfile } from "@/utils/employeeProfileApi";
import { canAccessRoute, hasFeature, hasRole, SystemRole } from "@/utils/roleAccess";
import { getAllDepartments, getAllPositions, Department, Position } from "@/utils/organizationStructureApi";

export default function CreateEmployeeProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<EmployeeProfile> & { password?: string }>({
    status: 'ACTIVE',
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loadingOrgData, setLoadingOrgData] = useState(false);

  // Check role-based access - only System Admin and HR Admin can create employees
  const canCreateEmployee = user ? hasFeature(user.roles, "createEmployee") : false;
  const canAccess = user ? canAccessRoute(user.roles, "/admin/employee-profile") : false;
  const isSystemAdmin = user ? hasRole(user.roles, SystemRole.SYSTEM_ADMIN) : false;
  const isHRAdmin = user ? hasRole(user.roles, SystemRole.HR_ADMIN) : false;

  useEffect(() => {
    if (!authLoading && user && canCreateEmployee && canAccess && (isSystemAdmin || isHRAdmin)) {
      loadOrganizationalData();
    }
  }, [user, authLoading, canCreateEmployee, canAccess, isSystemAdmin, isHRAdmin]);

  const loadOrganizationalData = async () => {
    try {
      setLoadingOrgData(true);
      const [deptsRes, positionsRes] = await Promise.all([
        getAllDepartments(),
        getAllPositions()
      ]);
      
      const depts = Array.isArray(deptsRes) ? deptsRes : [];
      const pos = Array.isArray(positionsRes) ? positionsRes : [];
      
      setDepartments(depts);
      setPositions(pos);
    } catch (err: any) {
      console.error("Error loading organizational data:", err);
      setError("Failed to load organizational structure data. Please refresh the page.");
    } finally {
      setLoadingOrgData(false);
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
      } as any,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.employeeNumber) {
      setError("Employee Number is required");
      return;
    }
    if (!formData.firstName) {
      setError("First Name is required");
      return;
    }
    if (!formData.lastName) {
      setError("Last Name is required");
      return;
    }
    if (!formData.nationalId) {
      setError("National ID is required");
      return;
    }
    if (!formData.dateOfHire) {
      setError("Date of Hire is required");
      return;
    }
    if (!formData.primaryDepartmentId) {
      setError("Primary Department is required");
      return;
    }
    if (!formData.primaryPositionId) {
      setError("Primary Position is required");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Prepare orgLinks object
      const deptId = typeof formData.primaryDepartmentId === 'object'
        ? String(formData.primaryDepartmentId._id || formData.primaryDepartmentId)
        : (formData.primaryDepartmentId ? String(formData.primaryDepartmentId) : undefined);

      const posId = typeof formData.primaryPositionId === 'object'
        ? String(formData.primaryPositionId._id || formData.primaryPositionId)
        : (formData.primaryPositionId ? String(formData.primaryPositionId) : undefined);

      const supervisorPosId = formData.supervisorPositionId
        ? (typeof formData.supervisorPositionId === 'object'
            ? String(formData.supervisorPositionId._id || formData.supervisorPositionId)
            : String(formData.supervisorPositionId))
        : undefined;

      const payGradeId = formData.payGradeId
        ? (typeof formData.payGradeId === 'object'
            ? String(formData.payGradeId._id || formData.payGradeId)
            : String(formData.payGradeId))
        : undefined;

      const orgLinks: any = {
        primaryDepartmentId: deptId,
        primaryPositionId: posId,
      };

      if (supervisorPosId && supervisorPosId.trim()) {
        orgLinks.supervisorPositionId = supervisorPosId;
      }
      if (payGradeId && payGradeId.trim()) {
        orgLinks.payGradeId = payGradeId;
      }

      // Prepare the payload
      const payload: any = {
        employeeNumber: formData.employeeNumber,
        firstName: formData.firstName,
        lastName: formData.lastName,
        nationalId: formData.nationalId,
        dateOfHire: formData.dateOfHire,
        status: formData.status || 'ACTIVE',
        orgLinks: orgLinks,
      };

      // Optional fields
      if (formData.middleName) payload.middleName = formData.middleName;
      if (formData.workEmail) payload.workEmail = formData.workEmail;
      if (formData.personalEmail) payload.personalEmail = formData.personalEmail;
      if (formData.password) payload.password = formData.password;
      if (formData.mobilePhone) payload.mobilePhone = formData.mobilePhone;
      if (formData.homePhone) payload.homePhone = formData.homePhone;
      if (formData.gender) payload.gender = formData.gender;
      if (formData.maritalStatus) payload.maritalStatus = formData.maritalStatus;
      if (formData.dateOfBirth) payload.dateOfBirth = formData.dateOfBirth;
      if (formData.contractType) payload.contractType = formData.contractType;
      if (formData.workType) payload.workType = formData.workType;
      if (formData.contractStartDate) payload.contractStartDate = formData.contractStartDate;
      if (formData.contractEndDate) payload.contractEndDate = formData.contractEndDate;
      if (formData.biography) payload.biography = formData.biography;
      if (formData.profilePictureUrl) payload.profilePictureUrl = formData.profilePictureUrl;
      if (formData.statusEffectiveFrom) payload.statusEffectiveFrom = formData.statusEffectiveFrom;
      
      if (formData.address) {
        payload.address = formData.address;
      }

      console.log("Creating employee with payload:", payload);

      const response = await createEmployeeProfile(payload);
      
      // Redirect to the newly created employee's profile page
      router.push(`/admin/employee-profile/${response._id || response.id}`);
    } catch (err: any) {
      console.error("Error creating employee:", err);
      setError(err.response?.data?.message || err.message || "Failed to create employee profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-slate-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !canAccess || !canCreateEmployee || (!isSystemAdmin && !isHRAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card title="Access Denied" className="max-w-md w-full text-center">
          <p className="text-slate-600 mb-4">You do not have permission to create employee profiles.</p>
          <Button onClick={() => router.push("/admin/employee-profile")} variant="primary">
            Back to Employee List
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <RouteGuard requiredRoute="/admin/employee-profile" requiredRoles={["System Admin", "HR Admin"]}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background-light to-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent">
                Create Employee Profile
              </h1>
              <p className="text-slate-600 text-base md:text-lg">
                {isSystemAdmin 
                  ? "Create new employee profile - System Administrator"
                  : "Create new employee profile - HR Admin"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push("/admin/employee-profile")}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Create Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Basic Information */}
              <Card title="Basic Information">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Employee Number *"
                      value={formData.employeeNumber || ""}
                      onChange={(e) => handleInputChange("employeeNumber", e.target.value)}
                      required
                      placeholder="e.g., EMP001"
                    />
                    <Input
                      label="National ID *"
                      value={formData.nationalId || ""}
                      onChange={(e) => handleInputChange("nationalId", e.target.value)}
                      required
                      placeholder="National ID"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="First Name *"
                      value={formData.firstName || ""}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      required
                    />
                    <Input
                      label="Middle Name"
                      value={formData.middleName || ""}
                      onChange={(e) => handleInputChange("middleName", e.target.value)}
                    />
                    <Input
                      label="Last Name *"
                      value={formData.lastName || ""}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Date of Hire *"
                      type="date"
                      value={formData.dateOfHire || ""}
                      onChange={(e) => handleInputChange("dateOfHire", e.target.value)}
                      required
                    />
                    <Input
                      label="Date of Birth"
                      type="date"
                      value={formData.dateOfBirth || ""}
                      onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Gender</label>
                      <select
                        className="input"
                        value={formData.gender || ""}
                        onChange={(e) => handleInputChange("gender", e.target.value || undefined)}
                      >
                        <option value="">Select Gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Marital Status</label>
                      <select
                        className="input"
                        value={formData.maritalStatus || ""}
                        onChange={(e) => handleInputChange("maritalStatus", e.target.value || undefined)}
                      >
                        <option value="">Select Status</option>
                        <option value="SINGLE">Single</option>
                        <option value="MARRIED">Married</option>
                        <option value="DIVORCED">Divorced</option>
                        <option value="WIDOWED">Widowed</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Authentication & Contact Information */}
              <Card title="Authentication & Contact Information">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Work Email"
                      type="email"
                      value={formData.workEmail || ""}
                      onChange={(e) => handleInputChange("workEmail", e.target.value)}
                      placeholder="employee@company.com"
                    />
                    <Input
                      label="Personal Email"
                      type="email"
                      value={formData.personalEmail || ""}
                      onChange={(e) => handleInputChange("personalEmail", e.target.value)}
                      placeholder="personal@email.com"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Password"
                      type="password"
                      value={formData.password || ""}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder="Set initial password (min 6 characters)"
                      helperText="Password will be hashed and stored securely"
                    />
                    <div>
                      <label className="label">Status *</label>
                      <select
                        className="input"
                        value={formData.status || "ACTIVE"}
                        onChange={(e) => handleInputChange("status", e.target.value)}
                        required
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Mobile Phone"
                      value={formData.mobilePhone || ""}
                      onChange={(e) => handleInputChange("mobilePhone", e.target.value)}
                      placeholder="+1234567890"
                    />
                    <Input
                      label="Home Phone"
                      value={formData.homePhone || ""}
                      onChange={(e) => handleInputChange("homePhone", e.target.value)}
                      placeholder="+1234567890"
                    />
                  </div>
                  <Input
                    label="Profile Picture URL"
                    value={formData.profilePictureUrl || ""}
                    onChange={(e) => handleInputChange("profilePictureUrl", e.target.value)}
                    placeholder="https://example.com/profile.jpg"
                  />
                </div>
              </Card>

              {/* Organizational Structure */}
              <Card title="Organizational Structure">
                <div className="space-y-4">
                  {loadingOrgData ? (
                    <div className="text-center py-4">
                      <p className="text-slate-600">Loading organizational data...</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="label">Primary Department *</label>
                        <select
                          className="input"
                          value={formData.primaryDepartmentId || ""}
                          onChange={(e) => handleInputChange("primaryDepartmentId", e.target.value || undefined)}
                          required
                        >
                          <option value="">Select Department</option>
                          {departments
                            .filter(dept => dept.isActive !== false)
                            .map((dept) => (
                              <option key={dept._id} value={dept._id}>
                                {dept.name} {dept.code ? `(${dept.code})` : ''}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="label">Primary Position *</label>
                        <select
                          className="input"
                          value={formData.primaryPositionId || ""}
                          onChange={(e) => handleInputChange("primaryPositionId", e.target.value || undefined)}
                          required
                        >
                          <option value="">Select Position</option>
                          {positions
                            .filter(pos => pos.isActive !== false)
                            .map((pos) => (
                              <option key={pos._id} value={pos._id}>
                                {pos.title} {pos.code ? `(${pos.code})` : ''}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="label">Supervisor Position</label>
                        <select
                          className="input"
                          value={formData.supervisorPositionId || ""}
                          onChange={(e) => handleInputChange("supervisorPositionId", e.target.value || undefined)}
                        >
                          <option value="">Select Supervisor Position (Optional)</option>
                          {positions
                            .filter(pos => pos.isActive !== false)
                            .map((pos) => (
                              <option key={pos._id} value={pos._id}>
                                {pos.title} {pos.code ? `(${pos.code})` : ''}
                              </option>
                            ))}
                        </select>
                      </div>
                      <Input
                        label="Pay Grade ID"
                        value={formData.payGradeId || ""}
                        onChange={(e) => handleInputChange("payGradeId", e.target.value || undefined)}
                        placeholder="Pay Grade ID (Optional)"
                      />
                    </>
                  )}
                </div>
              </Card>

              {/* Employment Information */}
              <Card title="Employment Information">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Contract Type</label>
                      <select
                        className="input"
                        value={formData.contractType || ""}
                        onChange={(e) => handleInputChange("contractType", e.target.value || undefined)}
                      >
                        <option value="">Select Contract Type</option>
                        <option value="FULL_TIME_CONTRACT">Full Time Contract</option>
                        <option value="PART_TIME_CONTRACT">Part Time Contract</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Work Type</label>
                      <select
                        className="input"
                        value={formData.workType || ""}
                        onChange={(e) => handleInputChange("workType", e.target.value || undefined)}
                      >
                        <option value="">Select Work Type</option>
                        <option value="FULL_TIME">Full Time</option>
                        <option value="PART_TIME">Part Time</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Contract Start Date"
                      type="date"
                      value={formData.contractStartDate || ""}
                      onChange={(e) => handleInputChange("contractStartDate", e.target.value)}
                    />
                    <Input
                      label="Contract End Date"
                      type="date"
                      value={formData.contractEndDate || ""}
                      onChange={(e) => handleInputChange("contractEndDate", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Biography</label>
                    <textarea
                      className="input min-h-[100px]"
                      value={formData.biography || ""}
                      onChange={(e) => handleInputChange("biography", e.target.value)}
                      placeholder="Employee biography or notes..."
                    />
                  </div>
                </div>
              </Card>

              {/* Address Information */}
              <Card title="Address">
                <div className="space-y-4">
                  <Input
                    label="Street Address"
                    value={formData.address?.streetAddress || ""}
                    onChange={(e) => handleAddressChange("streetAddress", e.target.value)}
                    placeholder="Street address"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="City"
                      value={formData.address?.city || ""}
                      onChange={(e) => handleAddressChange("city", e.target.value)}
                      placeholder="City"
                    />
                    <Input
                      label="Country"
                      value={formData.address?.country || ""}
                      onChange={(e) => handleAddressChange("country", e.target.value)}
                      placeholder="Country"
                    />
                  </div>
                </div>
              </Card>

              {/* Submit Button */}
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  onClick={() => router.push("/admin/employee-profile")}
                  variant="outline"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={saving}
                  disabled={saving}
                >
                  {saving ? "Creating..." : "Create Employee Profile"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </RouteGuard>
  );
}

