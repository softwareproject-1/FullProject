"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import RouteGuard from "@/components/RouteGuard";
import { candidateApi, Candidate } from "@/utils/candidateApi";
import { canAccessRoute, hasRole, SystemRole } from "@/utils/roleAccess";

export default function CandidateApplicationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canAccess = user ? canAccessRoute(user.roles, "/candidate/applications") : false;

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
      setError(err.response?.data?.message || "Failed to load application information. Please contact HR.");
    } finally {
      setLoadingData(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "HIRED":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "OFFER_ACCEPTED":
      case "OFFER_SENT":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "INTERVIEW":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "SCREENING":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "REJECTED":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "WITHDRAWN":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-primary/20 text-primary border-primary/30";
    }
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return "Applied";
    return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading || loadingData) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text-muted text-lg">Loading applications...</p>
        </div>
      </main>
    );
  }

  return (
    <RouteGuard 
      requiredRoute="/candidate/applications" 
      requiredRoles={["Job Candidate"]}
    >
      {!user || !canAccess ? null : (
        <main className="min-h-screen bg-gradient-to-br from-background via-background-light to-background p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-text mb-2 bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent">
                  My Applications
                </h1>
                <p className="text-text-muted text-lg">
                  Track the status of your job applications
                </p>
              </div>
              <Button
                onClick={() => router.push("/candidate")}
                variant="outline"
              >
                Back to Dashboard
              </Button>
            </header>

            {error && (
              <Card>
                <CardContent>
                  <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400">
                    <p className="font-semibold mb-2">⚠️ {error}</p>
                    <p className="text-sm">
                      To access your application information, please contact HR or use the link provided in your application email.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!error && candidate && (
              <Card>
                <CardHeader>
                  <CardTitle>Application Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                  <div className="p-4 bg-background rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-text font-semibold text-lg">
                          {typeof candidate.positionId === 'object' 
                            ? candidate.positionId.title || candidate.positionId.name 
                            : "Position Information"}
                        </h3>
                        {candidate.departmentId && (
                          <p className="text-text-muted text-sm mt-1">
                            Department: {typeof candidate.departmentId === 'object' 
                              ? candidate.departmentId.name 
                              : candidate.departmentId}
                          </p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(candidate.status)}`}>
                        {getStatusLabel(candidate.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="text-text-muted text-sm">Application Date</label>
                        <p className="text-text font-medium">
                          {candidate.applicationDate 
                            ? new Date(candidate.applicationDate).toLocaleDateString()
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <label className="text-text-muted text-sm">Candidate Number</label>
                        <p className="text-text font-medium">{candidate.candidateNumber}</p>
                      </div>
                    </div>

                    {candidate.notes && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <label className="text-text-muted text-sm">Notes</label>
                        <p className="text-text font-medium whitespace-pre-wrap">{candidate.notes}</p>
                      </div>
                    )}

                    {candidate.resumeUrl && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <label className="text-text-muted text-sm">Resume</label>
                        <p className="text-text font-medium">
                          <a 
                            href={candidate.resumeUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View Resume →
                          </a>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <h4 className="text-blue-400 font-semibold mb-2">Application Status Guide</h4>
                    <div className="space-y-2 text-sm text-text-muted">
                      <p><span className="font-medium">APPLIED:</span> Your application has been received</p>
                      <p><span className="font-medium">SCREENING:</span> Your application is being reviewed</p>
                      <p><span className="font-medium">INTERVIEW:</span> You've been selected for an interview</p>
                      <p><span className="font-medium">OFFER_SENT:</span> An offer has been sent to you</p>
                      <p><span className="font-medium">OFFER_ACCEPTED:</span> You've accepted the offer</p>
                      <p><span className="font-medium">HIRED:</span> You've been hired and converted to an employee</p>
                    </div>
                  </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {!error && !candidate && (
              <Card>
                <CardContent>
                  <div className="text-center py-8">
                  <p className="text-text-muted mb-4">
                    No application information found. Please contact HR to set up your candidate profile.
                  </p>
                  <Button
                    onClick={() => router.push("/candidate")}
                    variant="outline"
                  >
                    Back to Dashboard
                  </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      )}
    </RouteGuard>
  );
}

