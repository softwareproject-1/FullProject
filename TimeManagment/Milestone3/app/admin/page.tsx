"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import RouteGuard from "@/components/RouteGuard";
import { canAccessRoute, hasFeature, getCombinedAccess, hasRole, SystemRole } from "@/utils/roleAccess";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Check specific roles
  const isSystemAdmin = user ? hasRole(user.roles, SystemRole.SYSTEM_ADMIN) : false;
  const isHRAdmin = user ? hasRole(user.roles, SystemRole.HR_ADMIN) : false;
  const isHRManager = user ? hasRole(user.roles, SystemRole.HR_MANAGER) : false;

  // Get role-based access
  const access = user ? getCombinedAccess(user.roles) : null;
  const canAccessOrgStructure = user ? canAccessRoute(user.roles, "/admin/organization-structure") : false;
  const canAccessPerformance = user ? canAccessRoute(user.roles, "/performance") : false;
  const canAccessHRManager = user ? canAccessRoute(user.roles, "/hr-manager") : false;
  const canManageChangeRequests = user ? hasFeature(user.roles, "manageChangeRequests") : false;
  const canManageDepartments = user ? hasFeature(user.roles, "createDepartments") : false;
  const canCreateAppraisalTemplates = user ? hasFeature(user.roles, "createAppraisalTemplates") : false;
  const canManageAppraisalCycles = user ? hasFeature(user.roles, "manageAppraisalCycles") : false;
  const canViewPayroll = user ? hasFeature(user.roles, "viewPayroll") : false;

  // Redirect HR Admin to their default route
  useEffect(() => {
    if (!loading && user && isHRAdmin && !isSystemAdmin) {
      // HR Admin should be on /hr-manager, not /admin
      router.replace("/hr-manager");
    }
  }, [loading, user, isHRAdmin, isSystemAdmin, router]);

  return (
    <RouteGuard requiredRoute="/admin" requiredRoles={["System Admin"]}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-slate-600 text-lg">Loading Admin Dashboard...</p>
          </div>
        </div>
      ) : !user ? (
        <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
          <Card className="max-w-md w-full bg-white">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-slate-600 mb-4">
                  Please login to access this page.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => router.push("/")} variant="outline">
                    Go to Home
                  </Button>
                  <Button onClick={() => router.push("/auth/login")} variant="default">
                    Login Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              {isSystemAdmin ? "System Administrator Dashboard" : "Admin Dashboard"}
            </h1>
            <p className="text-slate-600 text-base md:text-lg">
              Welcome back, <span className="text-slate-900 font-semibold">{user.firstName} {user.lastName}</span>
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
              <p className="text-slate-600 text-sm">
                Employee Number: <span className="text-blue-600 font-medium">{user.employeeNumber}</span>
              </p>
              {user.workEmail && (
                <span className="text-slate-600 text-sm hidden sm:inline">•</span>
              )}
              {user.workEmail && (
                <p className="text-slate-600 text-sm">
                  Email: <span className="text-blue-600 font-medium">{user.workEmail}</span>
                </p>
              )}
            </div>
            {user.roles && user.roles.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-slate-600 text-sm">Roles:</span>
                {user.roles.map((role, idx) => (
                  <span 
                    key={idx} 
                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs md:text-sm font-medium border border-blue-200"
                  >
                    {role}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {/* Change Requests - Available to System Admin and HR Admin */}
            {canManageChangeRequests && (
              <Button
                onClick={() => router.push("/admin/employee-profile/change-requests")}
                variant="default"
                className="w-full"
              >
                Review Change Requests
              </Button>
            )}
            
            {/* Organizational Structure - ONLY System Admin */}
            {isSystemAdmin && canManageDepartments && (
              <>
                <Button
                  onClick={() => router.push("/admin/organization-structure/departments")}
                  variant="default"
                  className="w-full"
                >
                  Manage Departments
                </Button>
                <Button
                  onClick={() => router.push("/admin/organization-structure/positions")}
                  variant="default"
                  className="w-full"
                >
                  Manage Positions
                </Button>
              </>
            )}
            
            {/* Performance Management - Available to System Admin and HR Admin */}
            {canAccessPerformance && (
              <>
                {canCreateAppraisalTemplates && (
                  <Button
                    onClick={() => router.push("/performance/templates")}
                    variant="default"
                    className="w-full"
                  >
                    Appraisal Templates
                  </Button>
                )}
                {canManageAppraisalCycles && (
                  <Button
                    onClick={() => router.push("/performance/cycles")}
                    variant="default"
                    className="w-full"
                  >
                    Manage appraisal cycle
                  </Button>
                )}
                <Button
                  onClick={() => router.push("/performance")}
                  variant="default"
                  className="w-full"
                >
                  Performance Hub
                </Button>
              </>
            )}
            
            {/* HR Manager Dashboard - Available to HR Admin and HR Manager, but NOT System Admin */}
            {canAccessHRManager && !isSystemAdmin && (isHRAdmin || isHRManager) && (
              <Button
                onClick={() => router.push("/hr-manager")}
                variant="default"
                className="w-full"
              >
                HR Manager Dashboard
              </Button>
            )}
            
            
            {/* Payroll - Available to HR Admin (read-only) */}
            {canViewPayroll && !isSystemAdmin && (
              <Button
                onClick={() => router.push("/admin/employee-profile")}
                variant="outline"
                className="w-full"
              >
                View Payroll Data
              </Button>
            )}
            
            {/* API Docs - Available to all */}
            {(isSystemAdmin || isHRAdmin) && (
              <Button
                onClick={() => window.open("http://localhost:3001/api/docs", "_blank")}
                variant="outline"
                className="w-full"
              >
                View API Docs
              </Button>
            )}
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
      )}
    </RouteGuard>
  );
}

