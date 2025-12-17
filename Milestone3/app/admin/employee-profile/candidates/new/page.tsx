"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
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
          <Card>
            <CardContent>
              <p className="text-red-600">You do not have permission to create candidates.</p>
            </CardContent>
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
          <CardHeader>
            <CardTitle>Create New Candidate</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="candidateNumber">Candidate Number *</Label>
                  <Input
                    id="candidateNumber"
                    name="candidateNumber"
                    value={formData.candidateNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("candidateNumber", e.target.value)}
                    required
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="nationalId">National ID *</Label>
                  <Input
                    id="nationalId"
                    name="nationalId"
                    value={formData.nationalId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("nationalId", e.target.value)}
                    required
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("firstName", e.target.value)}
                    required
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    name="middleName"
                    value={formData.middleName || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("middleName", e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("lastName", e.target.value)}
                    required
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="personalEmail">Personal Email</Label>
                  <Input
                    id="personalEmail"
                    name="personalEmail"
                    type="email"
                    value={formData.personalEmail || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("personalEmail", e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="mobilePhone">Mobile Phone</Label>
                  <Input
                    id="mobilePhone"
                    name="mobilePhone"
                    value={formData.mobilePhone || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("mobilePhone", e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("dateOfBirth", e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.gender || ""}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange("gender", e.target.value)}
                    disabled={saving}
                  >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>

                <div>
                  <Label htmlFor="maritalStatus">Marital Status</Label>
                  <select
                    id="maritalStatus"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.maritalStatus || ""}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange("maritalStatus", e.target.value)}
                    disabled={saving}
                  >
                  <option value="">Select Status</option>
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                  <option value="DIVORCED">Divorced</option>
                  <option value="WIDOWED">Widowed</option>
                </select>
              </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.status || "APPLIED"}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange("status", e.target.value)}
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

                <div>
                  <Label htmlFor="applicationDate">Application Date</Label>
                  <Input
                    id="applicationDate"
                    name="applicationDate"
                    type="date"
                    value={formData.applicationDate || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("applicationDate", e.target.value)}
                    disabled={saving}
                  />
                </div>

                {!loadingOrgData && departments.length > 0 && (
                  <div>
                    <Label htmlFor="departmentId">Department</Label>
                    <select
                      id="departmentId"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.departmentId || ""}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange("departmentId", e.target.value)}
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
                  <div>
                    <Label htmlFor="positionId">Position</Label>
                    <select
                      id="positionId"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.positionId || ""}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange("positionId", e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Select Position</option>
                      {positions.map((pos) => (
                        <option key={pos._id} value={pos._id}>
                          {pos.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <Label htmlFor="resumeUrl">Resume URL</Label>
                  <Input
                    id="resumeUrl"
                    name="resumeUrl"
                    type="url"
                    value={formData.resumeUrl || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("resumeUrl", e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="streetAddress">Address - Street</Label>
                  <Input
                    id="streetAddress"
                    value={formData.address?.streetAddress || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAddressChange("streetAddress", e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.address?.city || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAddressChange("city", e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.address?.country || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAddressChange("country", e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    rows={4}
                    value={formData.notes || ""}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("notes", e.target.value)}
                    disabled={saving}
                  />
                </div>
            </div>

              <div className="mt-6 flex gap-4">
                <Button type="submit" variant="default" disabled={saving}>
                  {saving ? "Creating..." : "Create Candidate"}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

