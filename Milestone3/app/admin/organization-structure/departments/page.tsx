"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import RouteGuard from "@/components/RouteGuard";
import { getAllDepartments, deactivateDepartment, reactivateDepartment, Department } from "@/utils/organizationStructureApi";
import { canAccessRoute, hasFeature, hasRole, SystemRole } from "@/utils/roleAccess";

export default function DepartmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);

  // System Admin can manage, HR Employee can view (read-only)
  const isSystemAdmin = user ? hasRole(user.roles, SystemRole.SYSTEM_ADMIN) : false;
  const isHREmployee = user ? hasRole(user.roles, SystemRole.HR_EMPLOYEE) : false;
  const canManageDepartments = user ? hasFeature(user.roles, "createDepartments") : false;
  const canViewOrganizationalCharts = user ? hasFeature(user.roles, "viewOrganizationalCharts") : false;

  useEffect(() => {
    if (!authLoading && user && (isSystemAdmin || canViewOrganizationalCharts)) {
      fetchDepartments();
    }
  }, [user, authLoading, isSystemAdmin, canViewOrganizationalCharts]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllDepartments();
      setDepartments(Array.isArray(response) ? response : []);
    } catch (err: any) {
      console.error("Error fetching departments:", err);
      setError(err.response?.data?.message || "Failed to fetch departments");
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (departmentId: string) => {
    if (!confirm("Are you sure you want to deactivate this department?")) {
      return;
    }

    try {
      setDeactivatingId(departmentId);
      setError(null);
      await deactivateDepartment(departmentId, "Deactivated by System Admin");
      await fetchDepartments();
    } catch (err: any) {
      console.error("Error deactivating department:", err);
      setError(err.response?.data?.message || "Failed to deactivate department");
    } finally {
      setDeactivatingId(null);
    }
  };

  const handleReactivate = async (departmentId: string) => {
    if (!confirm("Are you sure you want to reactivate this department?")) {
      return;
    }

    try {
      setReactivatingId(departmentId);
      setError(null);
      await reactivateDepartment(departmentId, "Reactivated by System Admin");
      await fetchDepartments();
    } catch (err: any) {
      console.error("Error reactivating department:", err);
      setError(err.response?.data?.message || "Failed to reactivate department");
    } finally {
      setReactivatingId(null);
    }
  };

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-600 text-lg">Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <RouteGuard 
      requiredRoute="/admin/organization-structure" 
    >
      {loading || authLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-slate-600 text-lg">Loading...</p>
          </div>
        </div>
      ) : !user ? null : (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Departments
            </h1>
            <p className="text-slate-600 text-base md:text-lg">
              {canManageDepartments ? "Manage organizational departments" : "View organizational departments (read-only)"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push("/admin")}
              variant="outline"
              className="bg-white text-slate-900 border-slate-300 hover:bg-slate-100"
            >
              Back to Dashboard
            </Button>
            {canManageDepartments && (
              <Button
                onClick={() => router.push("/admin/organization-structure/departments/new")}
                variant="default"
              >
                Create Department
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6 bg-white">
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="search">Search Departments</Label>
              <Input
                id="search"
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Departments Table */}
        <Card className="bg-white">
          <CardContent>
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left p-4 text-slate-900 font-semibold">Code</th>
                  <th className="text-left p-4 text-slate-900 font-semibold">Name</th>
                  <th className="text-left p-4 text-slate-900 font-semibold">Description</th>
                  <th className="text-left p-4 text-slate-900 font-semibold">Status</th>
                  <th className="text-left p-4 text-slate-900 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-slate-600">
                      {searchTerm ? "No departments found matching your search" : "No departments found"}
                    </td>
                  </tr>
                ) : (
                  filteredDepartments.map((department) => (
                    <tr key={department._id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-900 font-mono text-sm">{department.code}</td>
                      <td className="p-4 text-slate-900 font-medium">{department.name}</td>
                      <td className="p-4 text-slate-600 text-sm">{department.description || "-"}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${
                          department.isActive
                            ? "bg-green-500/20 text-green-600 border-green-500/30"
                            : "bg-gray-500/20 text-gray-600 border-gray-500/30"
                        }`}>
                          {department.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {/* Only show View button if user can access department details (System Admin only) */}
                          {isSystemAdmin && (
                            <Button
                              onClick={() => router.push(`/admin/organization-structure/departments/${department._id}`)}
                              variant="outline"
                              className="text-xs px-3 py-1"
                            >
                              View
                            </Button>
                          )}
                          {canManageDepartments && (
                            <>
                              <Button
                                onClick={() => router.push(`/admin/organization-structure/departments/${department._id}/edit`)}
                                variant="default"
                                className="text-xs px-3 py-1"
                              >
                                Edit
                              </Button>
                              {department.isActive ? (
                                <Button
                                  onClick={() => handleDeactivate(department._id)}
                                  variant="outline"
                                  className="text-xs px-3 py-1"
                                  disabled={deactivatingId === department._id || deactivatingId !== null || reactivatingId !== null}
                                >
                                  {deactivatingId === department._id ? "Deactivating..." : "Deactivate"}
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => handleReactivate(department._id)}
                                  variant="default"
                                  className="text-xs px-3 py-1"
                                  disabled={reactivatingId === department._id || deactivatingId !== null || reactivatingId !== null}
                                >
                                  {reactivatingId === department._id ? "Reactivating..." : "Reactivate"}
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
      )}
    </RouteGuard>
  );
}

