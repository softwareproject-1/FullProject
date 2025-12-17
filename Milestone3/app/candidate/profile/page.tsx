"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import RouteGuard from "@/components/RouteGuard";
import { candidateApi, Candidate, UpdateCandidateData } from "@/utils/candidateApi";
import { canAccessRoute, hasRole, SystemRole } from "@/utils/roleAccess";

export default function CandidateProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateCandidateData>({});

  const canAccess = user ? canAccessRoute(user.roles, "/candidate/profile") : false;
  const isCandidate = user ? hasRole(user.roles, SystemRole.JOB_CANDIDATE) : false;

  useEffect(() => {
    if (!loading && user && canAccess) {
      loadCandidateProfile();
    }
  }, [user, loading, canAccess]);

  const loadCandidateProfile = async () => {
    try {
      setLoadingData(true);
      setError(null);
      
      if (!user || !user._id) {
        setError("User not found");
        return;
      }

      // Try to get candidate profile by employee profile ID first
      let candidateData = null;
      
      try {
        candidateData = await candidateApi.getMyCandidateProfileByEmployeeId(user._id);
      } catch (err: any) {
        // If not found by employee ID, try by email
        if (user.personalEmail) {
          try {
            candidateData = await candidateApi.getMyCandidateProfileByEmail(user.personalEmail);
          } catch (err2: any) {
            // If not found by email, try nationalId
            if (user.nationalId) {
              try {
                candidateData = await candidateApi.getMyCandidateProfileByNationalId(user.nationalId);
              } catch (err3: any) {
                // All methods failed
              }
            }
          }
        } else if (user.nationalId) {
          try {
            candidateData = await candidateApi.getMyCandidateProfileByNationalId(user.nationalId);
          } catch (err2: any) {
            // Failed
          }
        }
      }

      if (candidateData) {
        setCandidate(candidateData);
      } else {
        setError("Candidate profile not found. Please contact HR to set up your candidate profile.");
      }
    } catch (err: any) {
      console.error("Error loading candidate profile:", err);
      setError(err.response?.data?.message || "Failed to load candidate profile. Please contact HR.");
    } finally {
      setLoadingData(false);
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

  const handleSave = async () => {
    if (!candidate?._id) {
      setError("Candidate ID not found");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      await candidateApi.updateMyCandidateProfile(candidate._id, formData);
      await loadCandidateProfile();
      setEditing(false);
      setFormData({});
    } catch (err: any) {
      console.error("Error updating candidate profile:", err);
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingData) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text-muted text-lg">Loading profile...</p>
        </div>
      </main>
    );
  }

  return (
    <RouteGuard 
      requiredRoute="/candidate/profile" 
      requiredRoles={["Job Candidate"]}
    >
      {!user || !canAccess ? null : (
        <main className="min-h-screen bg-gradient-to-br from-background via-background-light to-background p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-text mb-2 bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent">
                  My Candidate Profile
                </h1>
                <p className="text-text-muted text-lg">
                  View and update your candidate information
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => router.push("/candidate")}
                  variant="outline"
                >
                  Back to Dashboard
                </Button>
                {candidate && !editing && (
                  <Button
                    onClick={() => {
                      setEditing(true);
                      setFormData({
                        firstName: candidate.firstName,
                        middleName: candidate.middleName,
                        lastName: candidate.lastName,
                        personalEmail: candidate.personalEmail,
                        mobilePhone: candidate.mobilePhone,
                        homePhone: candidate.homePhone,
                        gender: candidate.gender,
                        maritalStatus: candidate.maritalStatus,
                        dateOfBirth: candidate.dateOfBirth,
                        address: candidate.address,
                        profilePictureUrl: candidate.profilePictureUrl,
                        resumeUrl: candidate.resumeUrl,
                      });
                    }}
                    variant="default"
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </header>

            {error && (
              <Card>
                <CardContent>
                  <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400">
                    <p className="font-semibold mb-2">⚠️ {error}</p>
                    <p className="text-sm">
                      To access your candidate profile, please contact HR or use the link provided in your application email.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!error && candidate && (
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">First Name</label>
                          <Input
                            value={formData.firstName || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("firstName", e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">Middle Name</label>
                          <Input
                            value={formData.middleName || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("middleName", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">Last Name</label>
                          <Input
                            value={formData.lastName || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("lastName", e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">Personal Email</label>
                          <Input
                            type="email"
                            value={formData.personalEmail || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("personalEmail", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">Mobile Phone</label>
                          <Input
                            value={formData.mobilePhone || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("mobilePhone", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">Home Phone</label>
                          <Input
                            value={formData.homePhone || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("homePhone", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">Date of Birth</label>
                          <Input
                            type="date"
                            value={formData.dateOfBirth || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("dateOfBirth", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="label">Gender</label>
                          <select
                            className="input"
                            value={formData.gender || ""}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange("gender", e.target.value)}
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
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange("maritalStatus", e.target.value)}
                          >
                            <option value="">Select Status</option>
                            <option value="SINGLE">Single</option>
                            <option value="MARRIED">Married</option>
                            <option value="DIVORCED">Divorced</option>
                            <option value="WIDOWED">Widowed</option>
                          </select>
                        </div>
                      </div>

                      <div className="border-t border-border pt-4">
                        <h3 className="text-text font-semibold mb-4">Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-text mb-1">Street Address</label>
                            <Input
                              value={formData.address?.streetAddress || ""}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAddressChange("streetAddress", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-text mb-1">City</label>
                            <Input
                              value={formData.address?.city || ""}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAddressChange("city", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-text mb-1">State/Province</label>
                            <Input
                              value={formData.address?.state || ""}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAddressChange("state", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-text mb-1">Postal Code</label>
                            <Input
                              value={formData.address?.postalCode || ""}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAddressChange("postalCode", e.target.value)}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-text mb-1">Country</label>
                            <Input
                              value={formData.address?.country || ""}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAddressChange("country", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-border pt-4">
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">Resume URL</label>
                          <Input
                            type="url"
                            value={formData.resumeUrl || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("resumeUrl", e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                        <p className="text-text-muted text-xs mt-1">
                          Enter the URL where your resume is hosted (e.g., Google Drive, Dropbox, etc.)
                        </p>
                      </div>

                      <div className="flex gap-2 justify-end pt-4 border-t border-border">
                        <Button
                          type="button"
                          onClick={() => {
                            setEditing(false);
                            setFormData({});
                            setError(null);
                          }}
                          variant="outline"
                          disabled={saving}
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
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-text-muted text-sm">Candidate Number</label>
                        <p className="text-text font-medium">{candidate.candidateNumber}</p>
                      </div>
                      <div>
                        <label className="text-text-muted text-sm">Full Name</label>
                        <p className="text-text font-medium">
                          {candidate.firstName} {candidate.middleName} {candidate.lastName}
                        </p>
                      </div>
                      <div>
                        <label className="text-text-muted text-sm">Personal Email</label>
                        <p className="text-text font-medium">{candidate.personalEmail || "-"}</p>
                      </div>
                      <div>
                        <label className="text-text-muted text-sm">Mobile Phone</label>
                        <p className="text-text font-medium">{candidate.mobilePhone || "-"}</p>
                      </div>
                      <div>
                        <label className="text-text-muted text-sm">Home Phone</label>
                        <p className="text-text font-medium">{candidate.homePhone || "-"}</p>
                      </div>
                      <div>
                        <label className="text-text-muted text-sm">Date of Birth</label>
                        <p className="text-text font-medium">
                          {candidate.dateOfBirth ? new Date(candidate.dateOfBirth).toLocaleDateString() : "-"}
                        </p>
                      </div>
                      <div>
                        <label className="text-text-muted text-sm">Gender</label>
                        <p className="text-text font-medium">{candidate.gender || "-"}</p>
                      </div>
                      <div>
                        <label className="text-text-muted text-sm">Marital Status</label>
                        <p className="text-text font-medium">{candidate.maritalStatus || "-"}</p>
                      </div>
                    </div>

                    {candidate.address && (
                      <div className="border-t border-border pt-4">
                        <h3 className="text-text font-semibold mb-4">Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-text-muted text-sm">Street Address</label>
                            <p className="text-text font-medium">{candidate.address.streetAddress || "-"}</p>
                          </div>
                          <div>
                            <label className="text-text-muted text-sm">City</label>
                            <p className="text-text font-medium">{candidate.address.city || "-"}</p>
                          </div>
                          <div>
                            <label className="text-text-muted text-sm">State/Province</label>
                            <p className="text-text font-medium">{candidate.address.state || "-"}</p>
                          </div>
                          <div>
                            <label className="text-text-muted text-sm">Postal Code</label>
                            <p className="text-text font-medium">{candidate.address.postalCode || "-"}</p>
                          </div>
                          <div>
                            <label className="text-text-muted text-sm">Country</label>
                            <p className="text-text font-medium">{candidate.address.country || "-"}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {candidate.resumeUrl && (
                      <div className="border-t border-border pt-4">
                        <label className="text-text-muted text-sm">Resume</label>
                        <p className="text-text font-medium">
                          <a 
                            href={candidate.resumeUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View Resume
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      )}
    </RouteGuard>
  );
}

