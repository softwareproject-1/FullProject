"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import RouteGuard from "@/components/RouteGuard";
import { candidateApi, CreateCandidateData } from "@/utils/candidateApi";
import { canAccessRoute, hasFeature, hasRole, SystemRole } from "@/utils/roleAccess";
import { getAllDepartments, getAllPositions, Department, Position } from "@/utils/organizationStructureApi";

export default function CreateCandidatePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateCandidateData>({
    candidateNumber: "",
    firstName: "",
    lastName: "",
    nationalId: "",
    status: "APPLIED",
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loadingOrgData, setLoadingOrgData] = useState(false);

  // Check role-based access - only Recruiters can create candidates
  const canCreateCandidate = user ? hasFeature(user.roles, "createCandidate") : false;
  const canAccess = user ? canAccessRoute(user.roles, "/admin/employee-profile") : false;
  const isRecruiter = user ? hasRole(user.roles, SystemRole.RECRUITER) : false;

  useEffect(() => {
    if (!authLoading && user && canCreateCandidate && canAccess && isRecruiter) {
      loadOrganizationalData();
      // Generate candidate number if not provided
      if (!formData.candidateNumber) {
        const timestamp = Date.now();
        setFormData(prev => ({
          ...prev,
          candidateNumber: `CAND-${timestamp}`,
        }));
      }
    }
  }, [user, authLoading, canCreateCandidate, canAccess, isRecruiter]);

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
    if (!formData.candidateNumber) {
      setError("Candidate Number is required");
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

    try {
      setSaving(true);
      setError(null);
      console.log("Creating candidate with data:", formData);
      const result = await candidateApi.createCandidate(formData);
      console.log("Candidate created successfully:", result);
      // Redirect to candidate list
      router.push("/admin/employee-profile");
      // Force a page reload to refresh the list
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (err: any) {
      console.error("Error creating candidate:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(err.response?.data?.message || err.message || "Failed to create candidate");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text-muted text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !canCreateCandidate || !isRecruiter) {
    return (
      <RouteGuard requiredRoute="/admin/employee-profile" requiredRoles={["Recruiter"]}>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Card className="max-w-md">
            <p className="text-error">You do not have permission to create candidates.</p>
          </Card>
        </div>
      </RouteGuard>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-light to-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-text mb-2 bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent">
            Create Candidate
          </h1>
          <p className="text-text-muted text-base md:text-lg">
            Add a new candidate to the recruitment pipeline
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Candidate Number *"
                name="candidateNumber"
                value={formData.candidateNumber}
                onChange={(e) => handleInputChange("candidateNumber", e.target.value)}
                required
                disabled={saving}
              />

              <Input
                label="National ID *"
                name="nationalId"
                value={formData.nationalId}
                onChange={(e) => handleInputChange("nationalId", e.target.value)}
                required
                disabled={saving}
              />

              <Input
                label="First Name *"
                name="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                required
                disabled={saving}
              />

              <Input
                label="Middle Name"
                name="middleName"
                value={formData.middleName || ""}
                onChange={(e) => handleInputChange("middleName", e.target.value)}
                disabled={saving}
              />

              <Input
                label="Last Name *"
                name="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                required
                disabled={saving}
              />

              <Input
                label="Personal Email"
                name="personalEmail"
                type="email"
                value={formData.personalEmail || ""}
                onChange={(e) => handleInputChange("personalEmail", e.target.value)}
                disabled={saving}
              />

              <Input
                label="Mobile Phone"
                name="mobilePhone"
                value={formData.mobilePhone || ""}
                onChange={(e) => handleInputChange("mobilePhone", e.target.value)}
                disabled={saving}
              />

              <Input
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth || ""}
                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                disabled={saving}
              />

              <div className="mb-4 w-full">
                <label className="label">Gender</label>
                <select
                  className="input"
                  value={formData.gender || ""}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  disabled={saving}
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>

              <div className="mb-4 w-full">
                <label className="label">Marital Status</label>
                <select
                  className="input"
                  value={formData.maritalStatus || ""}
                  onChange={(e) => handleInputChange("maritalStatus", e.target.value)}
                  disabled={saving}
                >
                  <option value="">Select Status</option>
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                  <option value="DIVORCED">Divorced</option>
                  <option value="WIDOWED">Widowed</option>
                </select>
              </div>

              <div className="mb-4 w-full">
                <label className="label">Status</label>
                <select
                  className="input"
                  value={formData.status || "APPLIED"}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  disabled={saving}
                >
                  <option value="APPLIED">Applied</option>
                  <option value="SCREENING">Screening</option>
                  <option value="INTERVIEW">Interview</option>
                  <option value="OFFER_SENT">Offer Sent</option>
                  <option value="OFFER_ACCEPTED">Offer Accepted</option>
                  <option value="HIRED">Hired</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="WITHDRAWN">Withdrawn</option>
                </select>
              </div>

              <Input
                label="Application Date"
                name="applicationDate"
                type="date"
                value={formData.applicationDate || ""}
                onChange={(e) => handleInputChange("applicationDate", e.target.value)}
                disabled={saving}
              />

              {!loadingOrgData && departments.length > 0 && (
                <div className="mb-4 w-full">
                  <label className="label">Department</label>
                  <select
                    className="input"
                    value={formData.departmentId || ""}
                    onChange={(e) => handleInputChange("departmentId", e.target.value)}
                    disabled={saving}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!loadingOrgData && positions.length > 0 && (
                <div className="mb-4 w-full">
                  <label className="label">Position</label>
                  <select
                    className="input"
                    value={formData.positionId || ""}
                    onChange={(e) => handleInputChange("positionId", e.target.value)}
                    disabled={saving}
                  >
                    <option value="">Select Position</option>
                    {positions.map((pos) => (
                      <option key={pos._id} value={pos._id}>
                        {pos.title || pos.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <Input
                label="Resume URL"
                name="resumeUrl"
                type="url"
                value={formData.resumeUrl || ""}
                onChange={(e) => handleInputChange("resumeUrl", e.target.value)}
                disabled={saving}
              />

              <div className="mb-4 w-full md:col-span-2">
                <label className="label">Address - Street</label>
                <input
                  className="input"
                  value={formData.address?.streetAddress || ""}
                  onChange={(e) => handleAddressChange("streetAddress", e.target.value)}
                  disabled={saving}
                />
              </div>

              <Input
                label="City"
                name="city"
                value={formData.address?.city || ""}
                onChange={(e) => handleAddressChange("city", e.target.value)}
                disabled={saving}
              />

              <Input
                label="Country"
                name="country"
                value={formData.address?.country || ""}
                onChange={(e) => handleAddressChange("country", e.target.value)}
                disabled={saving}
              />

              <div className="mb-4 w-full md:col-span-2">
                <label className="label">Notes</label>
                <textarea
                  className="input"
                  rows={4}
                  value={formData.notes || ""}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <Button type="submit" variant="primary" isLoading={saving} disabled={saving}>
                Create Candidate
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/employee-profile")}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

