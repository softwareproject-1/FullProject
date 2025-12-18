"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RouteGuard from "@/components/RouteGuard";
import { canAccessRoute, hasFeature, getCombinedAccess, hasRole, SystemRole } from "@/utils/roleAccess";

export default function HrManagerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Check specific roles
  const isHRAdmin = user ? hasRole(user.roles, SystemRole.HR_ADMIN) : false;
  const isHRManager = user ? hasRole(user.roles, SystemRole.HR_MANAGER) : false;
  const isSystemAdmin = user ? hasRole(user.roles, SystemRole.SYSTEM_ADMIN) : false;

  // Get role-based access
  const canManageChangeRequests = user ? hasFeature(user.roles, "manageChangeRequests") : false;
  const canCreateAppraisalTemplates = user ? hasFeature(user.roles, "createAppraisalTemplates") : false;
  const canManageAppraisalCycles = user ? hasFeature(user.roles, "manageAppraisalCycles") : false;
  const canViewPayroll = user ? hasFeature(user.roles, "viewPayroll") : false;
  const canAssignRoles = user ? hasFeature(user.roles, "assignRoles") : false;

  return (
    <RouteGuard requiredRoute="/hr-manager" requiredRoles={["HR Admin", "HR Manager", "System Admin"]}>
      {loading ? (
        <main className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-text-muted text-lg">Loading HR Dashboard...</p>
          </div>
        </main>
      ) : !user ? null : (
        <main className="min-h-screen bg-gradient-to-br from-background via-background-light to-background p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-text mb-2 bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent">
                  {isHRAdmin ? "HR Admin Dashboard" : "HR Manager Dashboard"}
                </h1>
            <p className="text-text-muted text-base md:text-lg">
              Welcome, <span className="text-text font-semibold">{user?.firstName} {user?.lastName}</span>
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
              {user?.employeeNumber && (
                <p className="text-text-muted text-sm">
                  {isHRAdmin ? "HR Admin ID" : "Employee Number"}: <span className="text-primary font-medium">{user.employeeNumber}</span>
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
          <Button onClick={() => router.push("/performance")} variant="default" className="w-full md:w-auto">
            Go to Performance Hub
          </Button>
        </div>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {/* Change Requests - Both HR Admin and HR Manager */}
              {canManageChangeRequests && (
                <Button 
                  onClick={() => router.push("/admin/employee-profile/change-requests")} 
                  variant="default" 
                  className="w-full"
                >
                  Review Change Requests
                </Button>
              )}
              
              {/* Appraisal Templates - Both can create */}
              {canCreateAppraisalTemplates && (
                <Button 
                  onClick={() => router.push("/performance/templates")} 
                  variant="default" 
                  className="w-full"
                >
                  Appraisal Templates
                </Button>
              )}
              
              {/* Appraisal Cycles - Both can manage */}
              {canManageAppraisalCycles && (
                <Button 
                  onClick={() => router.push("/performance/cycles")} 
                  variant="default" 
                  className="w-full"
                >
                  Manage appraisal cycle
                </Button>
              )}
              
              {/* Performance Hub */}
              <Button 
                onClick={() => router.push("/performance")} 
                variant="default" 
                className="w-full"
              >
                Performance Hub
              </Button>
              
              {/* Disputes */}
              <Button 
                onClick={() => router.push("/performance/disputes")} 
                variant="default" 
                className="w-full"
              >
                View Disputes
              </Button>
              
              {/* View Employees - HR Manager can view (read-only) */}
              {isHRManager && (
                <Button 
                  onClick={() => router.push("/admin/employee-profile")} 
                  variant="default" 
                  className="w-full"
                >
                  View Employees
                </Button>
              )}
              
              {/* Payroll - HR Admin can view */}
              {canViewPayroll && isHRAdmin && (
                <Button 
                  onClick={() => router.push("/admin/employee-profile")} 
                  variant="outline" 
                  className="w-full"
                >
                  View Payroll Data
                </Button>
              )}
              
              {/* Role Assignment - HR Admin can assign HR roles */}
              {canAssignRoles && isHRAdmin && (
                <Button 
                  onClick={() => router.push("/admin/employee-profile")} 
                  variant="outline" 
                  className="w-full"
                >
                  Assign HR Roles
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
      )}
    </RouteGuard>
  );
}

