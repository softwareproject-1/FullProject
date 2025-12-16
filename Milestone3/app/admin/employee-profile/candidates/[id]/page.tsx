"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import RouteGuard from "@/components/RouteGuard";
import { candidateApi, Candidate } from "@/utils/candidateApi";
import { canAccessRoute, hasFeature, hasRole, SystemRole } from "@/utils/roleAccess";

export default function CandidateDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const candidateId = params?.id as string;
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check role-based access
  const canAccess = user ? canAccessRoute(user.roles, "/admin/employee-profile") : false;
  const canViewCandidates = user ? hasFeature(user.roles, "viewCandidates") : false;
  const canEditCandidate = user ? hasFeature(user.roles, "editCandidate") : false;
  const isRecruiter = user ? hasRole(user.roles, SystemRole.RECRUITER) : false;

  useEffect(() => {
    if (!authLoading && user && canAccess && canViewCandidates && candidateId) {
      fetchCandidate();
    }
  }, [candidateId, user, authLoading, canAccess, canViewCandidates]);

  const fetchCandidate = async () => {
    try {
      setLoading(true);
      setError(null);
      const candidateData = await candidateApi.getCandidateById(candidateId);
      setCandidate(candidateData);
    } catch (err: any) {
      console.error("Error fetching candidate:", err);
      setError(err.response?.data?.message || "Failed to fetch candidate");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const statusClasses: { [key: string]: string } = {
      APPLIED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      SCREENING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      INTERVIEW: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      OFFER_SENT: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      OFFER_ACCEPTED: "bg-green-500/20 text-green-400 border-green-500/30",
      HIRED: "bg-green-600/20 text-green-500 border-green-600/30",
      REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
      WITHDRAWN: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    return statusClasses[status] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text-muted text-lg">Loading candidate...</p>
        </div>
      </div>
    );
  }

  if (!user || !canViewCandidates) {
    return (
      <RouteGuard requiredRoute="/admin/employee-profile" requiredRoles={["Recruiter"]}>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Card className="max-w-md">
            <p className="text-error">You do not have permission to view candidates.</p>
          </Card>
        </div>
      </RouteGuard>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background-light to-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <div className="text-center">
              <p className="text-error mb-4">{error || "Candidate not found"}</p>
              <Button onClick={() => router.push("/admin/employee-profile")} variant="outline">
                Back to Candidates
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-light to-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-text mb-2 bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent">
              Candidate Profile
            </h1>
            <p className="text-text-muted text-base md:text-lg">
              {candidate.firstName} {candidate.middleName} {candidate.lastName}
            </p>
          </div>
          <div className="flex gap-2">
            {canEditCandidate && (
              <Button
                onClick={() => router.push(`/admin/employee-profile/candidates/${candidateId}/edit`)}
                variant="primary"
              >
                Edit Candidate
              </Button>
            )}
            <Button onClick={() => router.push("/admin/employee-profile")} variant="outline">
              Back to Candidates
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card title="Basic Information">
            <div className="space-y-4">
              <div>
                <label className="text-text-muted text-sm">Candidate Number</label>
                <p className="text-text font-medium">{candidate.candidateNumber || "-"}</p>
              </div>
              <div>
                <label className="text-text-muted text-sm">Full Name</label>
                <p className="text-text font-medium">
                  {candidate.firstName} {candidate.middleName} {candidate.lastName}
                </p>
              </div>
              <div>
                <label className="text-text-muted text-sm">National ID</label>
                <p className="text-text font-medium">{candidate.nationalId || "-"}</p>
              </div>
              <div>
                <label className="text-text-muted text-sm">Status</label>
                <div className="mt-1">
                  <span className={`px-3 py-1 rounded text-sm font-medium border ${getStatusBadgeClass(candidate.status || "")}`}>
                    {candidate.status || "-"}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card title="Contact Information">
            <div className="space-y-4">
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
            </div>
          </Card>

          {/* Personal Information */}
          <Card title="Personal Information">
            <div className="space-y-4">
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
          </Card>

          {/* Application Information */}
          <Card title="Application Information">
            <div className="space-y-4">
              <div>
                <label className="text-text-muted text-sm">Application Date</label>
                <p className="text-text font-medium">
                  {candidate.applicationDate ? new Date(candidate.applicationDate).toLocaleDateString() : "-"}
                </p>
              </div>
              <div>
                <label className="text-text-muted text-sm">Department</label>
                <p className="text-text font-medium">
                  {typeof candidate.departmentId === 'object' && candidate.departmentId?.name 
                    ? candidate.departmentId.name 
                    : candidate.departmentId || "-"}
                </p>
              </div>
              <div>
                <label className="text-text-muted text-sm">Position</label>
                <p className="text-text font-medium">
                  {typeof candidate.positionId === 'object' && candidate.positionId?.title 
                    ? candidate.positionId.title 
                    : candidate.positionId || "-"}
                </p>
              </div>
              {candidate.resumeUrl && (
                <div>
                  <label className="text-text-muted text-sm">Resume</label>
                  <p className="text-text font-medium">
                    <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      View Resume
                    </a>
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Address */}
          {candidate.address && (
            <Card title="Address" className="md:col-span-2">
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
                  <label className="text-text-muted text-sm">State</label>
                  <p className="text-text font-medium">{candidate.address.state || "-"}</p>
                </div>
                <div>
                  <label className="text-text-muted text-sm">Country</label>
                  <p className="text-text font-medium">{candidate.address.country || "-"}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Notes */}
          {candidate.notes && (
            <Card title="Notes" className="md:col-span-2">
              <p className="text-text whitespace-pre-wrap">{candidate.notes}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

