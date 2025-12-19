"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RouteGuard from "@/components/RouteGuard";
import { canAccessRoute, hasFeature, hasRole, SystemRole } from "@/utils/roleAccess";

export default function PerformanceHub() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Check role-based access
  const canAccess = user ? canAccessRoute(user.roles, "/performance") : false;
  const canCreateTemplates = user ? hasFeature(user.roles, "createAppraisalTemplates") : false;
  const canViewTemplates = user ? hasFeature(user.roles, "viewAppraisalTemplates") : false;
  const canManageCycles = user ? hasFeature(user.roles, "manageAppraisalCycles") : false;
  const canAssistCycles = user ? hasFeature(user.roles, "assistAppraisalCycles") : false;
  const canEvaluateEmployees = user ? hasFeature(user.roles, "evaluateEmployees") : false;
  const canViewOwnPerformance = user ? hasFeature(user.roles, "viewOwnPerformance") : false;
  const canViewTeamPerformance = user ? hasFeature(user.roles, "viewTeamPerformance") : false;
  const canViewPerformanceStatus = user ? hasFeature(user.roles, "viewPerformanceStatus") : false;
  const canSubmitDisputes = user ? hasFeature(user.roles, "submitDisputes") : false;
  const canResolveDisputes = user ? hasFeature(user.roles, "resolveDisputes") : false;
  const canAccessCycles = user ? canAccessRoute(user.roles, "/performance/cycles") : false;
  const isDepartmentEmployee = user ? hasRole(user.roles, SystemRole.DEPARTMENT_EMPLOYEE) : false;

  return (
    <RouteGuard 
      requiredRoute="/performance" 
      requiredRoles={["System Admin", "HR Admin", "HR Manager", "HR Employee", "department head", "department employee"]}
    >
      {loading ? (
        <main className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-slate-600 text-lg">Loading Performance hub...</p>
          </div>
        </main>
      ) : !user || !canAccess ? null : (
        <main className="min-h-screen bg-slate-50 p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <header>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                Performance Management
              </h1>
              <p className="text-slate-600 text-lg">
                {canCreateTemplates || canManageCycles 
                  ? "Manage templates, cycles, assignments, records, and disputes."
                  : canEvaluateEmployees
                  ? "Evaluate employees and view performance data."
                  : "View your performance evaluations and submit disputes."}
              </p>
            </header>

            {/* Quick Action for Department Heads - Evaluate Employees */}
            {canEvaluateEmployees && !canManageCycles && (
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300">
                <CardHeader>
                  <CardTitle className="text-slate-900 flex items-center gap-2">
                    <span>⚡ Quick Action</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">Evaluate Your Team</h3>
                      <p className="text-slate-600 text-sm">
                        Click below to view available appraisal cycles and evaluate your team members.
                      </p>
                    </div>
                    <Button 
                      onClick={() => router.push("/performance/cycles")} 
                      variant="default" 
                      className="w-full md:w-auto min-w-[200px]"
                      size="lg"
                    >
                      Evaluate Employees →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-slate-900">Performance Modules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(canCreateTemplates || canViewTemplates) && (
                    <Button onClick={() => router.push("/performance/templates")} variant="outline" className="w-full text-slate-900 border-slate-300 hover:bg-slate-100">
                      {canCreateTemplates ? "Templates" : "View Templates"}
                    </Button>
                  )}
                  {(canManageCycles || canAssistCycles || canEvaluateEmployees || (canAccessCycles && isDepartmentEmployee)) && (
                    <Button onClick={() => router.push("/performance/cycles")} variant="outline" className="w-full text-slate-900 border-slate-300 hover:bg-slate-100">
                      {canManageCycles ? "Cycles & Assignments" : canAssistCycles ? "Cycles (Assist)" : canEvaluateEmployees ? "View Cycles & Evaluate" : isDepartmentEmployee ? "My Appraisal Cycles" : "Cycles & Assignments"}
                    </Button>
                  )}
                  {(canResolveDisputes || canSubmitDisputes) && (
                    <Button onClick={() => router.push("/performance/disputes")} variant="outline" className="w-full text-slate-900 border-slate-300 hover:bg-slate-100">
                      Disputes
                    </Button>
                  )}
                  {canViewTeamPerformance && (
                    <Button onClick={() => router.push("/performance/team-results")} variant="outline" className="w-full text-slate-900 border-slate-300 hover:bg-slate-100">
                      Team Performance Results
                    </Button>
                  )}
                  {(canViewOwnPerformance || canViewPerformanceStatus) && (
                    <Button onClick={() => router.push("/performance/my-performance")} variant="outline" className="w-full text-slate-900 border-slate-300 hover:bg-slate-100">
                      {canViewOwnPerformance ? "My Performance" : "Performance Status"}
                    </Button>
                  )}
                </div>
                {/* Show message if no modules available */}
                {!canCreateTemplates && !canViewTemplates && !canManageCycles && !canAssistCycles && !canEvaluateEmployees && 
                 !canResolveDisputes && !canSubmitDisputes && !canViewTeamPerformance && !canViewOwnPerformance && !canViewPerformanceStatus &&
                 !(canAccessCycles && isDepartmentEmployee) && (
                  <div className="text-center py-8 text-slate-600">
                    <p>No performance modules available for your role.</p>
                    <p className="text-sm mt-2">Contact your administrator if you believe you should have access.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      )}
    </RouteGuard>
  );
}

