"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RouteGuard from "@/components/RouteGuard";
import { candidateApi, Candidate } from "@/utils/candidateApi";
import { canAccessRoute, hasRole, SystemRole } from "@/utils/roleAccess";

export default function CandidateDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canAccess = user ? canAccessRoute(user.roles, "/candidate") : false;
  const isCandidate = user ? hasRole(user.roles, SystemRole.JOB_CANDIDATE) : false;

  useEffect(() => {
    if (!loading && user && canAccess) {
      // For now, we'll need to get candidate ID from user
      // In a real scenario, candidates would have their candidate ID in their profile
      // For now, we'll try to get it from the user's nationalId or create a way to link
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

  if (loading || loadingData) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text-muted text-lg">Loading candidate dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <RouteGuard 
      requiredRoute="/candidate" 
      requiredRoles={["Job Candidate"]}
    >
      {!user || !canAccess ? null : (
        <main className="min-h-screen bg-gradient-to-br from-background via-background-light to-background p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-text mb-2 bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent">
                  Candidate Portal
                </h1>
                <p className="text-text-muted text-lg">
                  Manage your candidate profile and track your applications
                </p>
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
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Application Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                    <div>
                      <label className="text-text-muted text-sm">Current Status</label>
                      <p className="text-text font-semibold text-lg">
                        {candidate.status || "APPLIED"}
                      </p>
                    </div>
                    {candidate.applicationDate && (
                      <div>
                        <label className="text-text-muted text-sm">Application Date</label>
                        <p className="text-text font-medium">
                          {new Date(candidate.applicationDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {candidate.positionId && (
                      <div>
                        <label className="text-text-muted text-sm">Applied Position</label>
                        <p className="text-text font-medium">
                          {typeof candidate.positionId === 'object' 
                            ? candidate.positionId.title || candidate.positionId.name 
                            : candidate.positionId}
                        </p>
                      </div>
                    )}
                    {candidate.departmentId && (
                      <div>
                        <label className="text-text-muted text-sm">Department</label>
                        <p className="text-text font-medium">
                          {typeof candidate.departmentId === 'object' 
                            ? candidate.departmentId.name 
                            : candidate.departmentId}
                        </p>
                      </div>
                    )}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                      <Button
                        onClick={() => router.push("/candidate/profile")}
                        variant="default"
                        className="w-full"
                      >
                        View/Edit Profile
                      </Button>
                      <Button
                        onClick={() => router.push("/candidate/applications")}
                        variant="outline"
                        className="w-full"
                      >
                        View Applications
                      </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                      <p className="text-text font-semibold">
                        {candidate.firstName} {candidate.middleName} {candidate.lastName}
                      </p>
                      <p className="text-text-muted text-sm">
                        Candidate Number: {candidate.candidateNumber}
                      </p>
                      {candidate.personalEmail && (
                        <p className="text-text-muted text-sm">
                          Email: {candidate.personalEmail}
                        </p>
                      )}
                      {candidate.mobilePhone && (
                        <p className="text-text-muted text-sm">
                          Phone: {candidate.mobilePhone}
                        </p>
                      )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {!error && !candidate && (
              <Card>
                <CardContent>
                  <div className="text-center py-8">
                  <p className="text-text-muted mb-4">
                    No candidate profile found. Please contact HR to set up your candidate profile.
                  </p>
                  <Button
                    onClick={() => router.push("/")}
                    variant="outline"
                  >
                    Go to Home
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

