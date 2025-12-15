"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getDepartmentById, Department } from "@/utils/organizationStructureApi";
import { isSystemAdmin } from "@/utils/roleUtils";

export default function DepartmentDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const departmentId = params?.id as string;
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/auth/login");
      } else if (!isSystemAdmin(user.roles)) {
        router.replace("/unauthorized");
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && isSystemAdmin(user.roles) && departmentId) {
      fetchDepartment();
    }
  }, [departmentId, user]);

  const fetchDepartment = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDepartmentById(departmentId);
      setDepartment(response);
    } catch (err: any) {
      console.error("Error fetching department:", err);
      setError(err.response?.data?.message || "Failed to fetch department");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-600 text-lg">Loading department...</p>
        </div>
      </div>
    );
  }

  if (!user || !isSystemAdmin(user.roles)) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
        <Card className="max-w-md w-full text-center bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => router.push("/admin/organization-structure/departments")} variant="outline">
                Back to List
              </Button>
              <Button onClick={fetchDepartment} variant="default">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
        <Card className="max-w-md w-full text-center bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900">Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">Department not found</p>
            <Button onClick={() => router.push("/admin/organization-structure/departments")} variant="default">
              Back to List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Department Details
            </h1>
            <p className="text-slate-600 text-base md:text-lg">
              View department information
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push("/admin/organization-structure/departments")}
              variant="outline"
            >
              Back to List
            </Button>
            <Button
              onClick={() => router.push(`/admin/organization-structure/departments/${departmentId}/edit`)}
              variant="default"
            >
              Edit Department
            </Button>
          </div>
        </div>

        {/* Department Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-slate-900">Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-slate-600 text-sm">Code</label>
                  <p className="text-slate-900 font-medium font-mono">{department.code}</p>
                </div>
                <div>
                  <label className="text-slate-600 text-sm">Name</label>
                  <p className="text-slate-900 font-medium">{department.name}</p>
                </div>
                <div>
                  <label className="text-slate-600 text-sm">Status</label>
                  <div className="mt-1">
                    <span className={`px-3 py-1 rounded text-sm font-medium border ${
                      department.isActive
                        ? "bg-green-500/20 text-green-600 border-green-500/30"
                        : "bg-gray-500/20 text-gray-600 border-gray-500/30"
                    }`}>
                      {department.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-slate-900">Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {department.description && (
                  <div>
                    <label className="text-slate-600 text-sm">Description</label>
                    <p className="text-slate-900 font-medium whitespace-pre-wrap">{department.description}</p>
                  </div>
                )}
                {department.headPositionId && (
                  <div>
                    <label className="text-slate-600 text-sm">Head Position ID</label>
                    <p className="text-slate-900 font-medium font-mono">{department.headPositionId}</p>
                  </div>
                )}
                {department.createdAt && (
                  <div>
                    <label className="text-slate-600 text-sm">Created At</label>
                    <p className="text-slate-900 font-medium">
                      {new Date(department.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {department.updatedAt && (
                  <div>
                    <label className="text-slate-600 text-sm">Last Updated</label>
                    <p className="text-slate-900 font-medium">
                      {new Date(department.updatedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

