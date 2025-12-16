"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import RouteGuard from "@/components/RouteGuard";
import { Building2, Users, Network } from "lucide-react";
import { canAccessRoute, hasRole, SystemRole } from "@/utils/roleAccess";

export default function OrganizationStructurePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const isSystemAdmin = user ? hasRole(user.roles, SystemRole.SYSTEM_ADMIN) : false;
  const canAccess = user ? canAccessRoute(user.roles, "/admin/organization-structure") : false;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <RouteGuard
      requiredRoute="/admin/organization-structure"
      requiredRoles={["System Admin"]}
    >
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Organization Structure
            </h1>
            <p className="text-slate-600 text-base md:text-lg">
              Manage departments, positions, and organizational hierarchy
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Manage Departments Card */}
            <Card className="bg-white hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/admin/organization-structure/departments")}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-slate-900">Manage Departments</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Create, edit, and manage organizational departments. View department hierarchy and structure.
                </p>
                <Button
                  variant="default"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push("/admin/organization-structure/departments");
                  }}
                >
                  Go to Departments
                </Button>
              </CardContent>
            </Card>

            {/* Manage Positions Card */}
            <Card className="bg-white hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/admin/organization-structure/positions")}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <CardTitle className="text-slate-900">Manage Positions</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Create, edit, and manage job positions. Assign positions to departments and set reporting structures.
                </p>
                <Button
                  variant="default"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push("/admin/organization-structure/positions");
                  }}
                >
                  Go to Positions
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          {isSystemAdmin && (
            <Card className="bg-white">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Network className="w-6 h-6 text-slate-600" />
                  <CardTitle className="text-slate-900">Quick Actions</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push("/admin/organization-structure/departments/new")}
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Create New Department
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push("/admin/organization-structure/positions/new")}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Create New Position
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </RouteGuard>
  );
}

