"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import RouteGuard from "@/components/RouteGuard";
import { canAccessRoute, hasFeature, hasRole, SystemRole } from "@/utils/roleAccess";

const recruiterPrivileges = [
  "View and manage all candidates",
  "Create new candidate profiles",
  "Edit candidate information and status",
  "Update candidate status (APPLIED, SCREENING, INTERVIEW, etc.)",
  "View candidate profiles and qualifications",
  "Access organizational structure (to understand open positions)",
  "View position requirements",
  "Manage recruitment pipeline",
  "Coordinate with hiring managers",
  "Manage interview schedules",
];

export default function RecruiterPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Check specific roles
  const isRecruiter = user ? hasRole(user.roles, SystemRole.RECRUITER) : false;
  const isSystemAdmin = user ? hasRole(user.roles, SystemRole.SYSTEM_ADMIN) : false;

  // Get role-based access
  const canViewCandidates = user ? hasFeature(user.roles, "viewCandidates") : false;
  const canCreateCandidate = user ? hasFeature(user.roles, "createCandidate") : false;
  const canEditCandidate = user ? hasFeature(user.roles, "editCandidate") : false;
  const canManageRecruitment = user ? hasFeature(user.roles, "manageRecruitment") : false;

  return (
    <RouteGuard requiredRoute="/recruiter" requiredRoles={["Recruiter", "System Admin"]}>
      {loading ? (
        <main className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-text-muted text-lg">Loading Recruiter Dashboard...</p>
          </div>
        </main>
      ) : !user ? null : (
        <main className="min-h-screen bg-gradient-to-br from-background via-background-light to-background p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-text mb-2 bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent">
                  Recruiter Dashboard
                </h1>
                <p className="text-text-muted text-base md:text-lg">
                  Welcome, <span className="text-text font-semibold">{user?.firstName} {user?.lastName}</span>
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                  {user?.employeeNumber && (
                    <p className="text-text-muted text-sm">
                      Employee Number: <span className="text-primary font-medium">{user.employeeNumber}</span>
                    </p>
                  )}
                  {user?.workEmail && user?.employeeNumber && (
                    <span className="text-text-muted text-sm hidden sm:inline">•</span>
                  )}
                  {user?.workEmail && (
                    <p className="text-text-muted text-sm">
                      Email: <span className="text-primary font-medium">{user.workEmail}</span>
                    </p>
                  )}
                </div>
                {user?.roles && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-text-muted text-sm">Roles:</span>
                    {user.roles.map((role, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs md:text-sm font-medium border border-primary/30"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Card title="Recruiter Privileges" className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {recruiterPrivileges.map((privilege, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 md:p-4 bg-background rounded-lg border border-border hover:border-primary/50 hover:bg-background-light transition-all duration-200"
                  >
                    <span className="text-success text-lg md:text-xl mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-text text-xs md:text-sm flex-1 leading-relaxed">{privilege}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Quick Actions">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {/* Candidate Management - Main action */}
                {canViewCandidates && (
                  <Button 
                    onClick={() => router.push("/admin/employee-profile")} 
                    variant="primary" 
                    className="w-full"
                  >
                    Manage Candidates
                  </Button>
                )}
                
                {/* Create Candidate */}
                {canCreateCandidate && (
                  <Button 
                    onClick={() => router.push("/admin/employee-profile/candidates/new")} 
                    variant="primary" 
                    className="w-full"
                  >
                    Create New Candidate
                  </Button>
                )}
                
                {/* View All Candidates */}
                {canViewCandidates && (
                  <Button 
                    onClick={() => router.push("/admin/employee-profile")} 
                    variant="outline" 
                    className="w-full"
                  >
                    View All Candidates
                  </Button>
                )}
              </div>
            </Card>

            {/* Statistics Card */}
            <Card title="Recruitment Overview" className="mt-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-background rounded-lg border border-border">
                  <p className="text-text-muted text-sm mb-1">Total Candidates</p>
                  <p className="text-2xl font-bold text-text">-</p>
                  <p className="text-xs text-text-muted mt-1">Click "Manage Candidates" to view</p>
                </div>
                <div className="p-4 bg-background rounded-lg border border-border">
                  <p className="text-text-muted text-sm mb-1">In Screening</p>
                  <p className="text-2xl font-bold text-text">-</p>
                  <p className="text-xs text-text-muted mt-1">Click "Manage Candidates" to view</p>
                </div>
                <div className="p-4 bg-background rounded-lg border border-border">
                  <p className="text-text-muted text-sm mb-1">In Interview</p>
                  <p className="text-2xl font-bold text-text">-</p>
                  <p className="text-xs text-text-muted mt-1">Click "Manage Candidates" to view</p>
                </div>
                <div className="p-4 bg-background rounded-lg border border-border">
                  <p className="text-text-muted text-sm mb-1">Hired</p>
                  <p className="text-2xl font-bold text-text">-</p>
                  <p className="text-xs text-text-muted mt-1">Click "Manage Candidates" to view</p>
                </div>
              </div>
            </Card>
          </div>
        </main>
      )}
    </RouteGuard>
  );
}

