"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { getDepartmentById, updateDepartment, Department } from "@/utils/organizationStructureApi";
import { isSystemAdmin } from "@/utils/roleUtils";

export default function EditDepartmentPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const departmentId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    headPositionId: "",
  });

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
      const department = await getDepartmentById(departmentId);
      setFormData({
        name: department.name || "",
        description: department.description || "",
        headPositionId: department.headPositionId || "",
      });
    } catch (err: any) {
      console.error("Error fetching department:", err);
      setError(err.response?.data?.message || "Failed to fetch department");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      
      const payload: any = {};
      
      if (formData.name) payload.name = formData.name;
      if (formData.description) payload.description = formData.description;
      if (formData.headPositionId) payload.headPositionId = formData.headPositionId;

      await updateDepartment(departmentId, payload);
      router.push("/admin/organization-structure/departments");
    } catch (err: any) {
      console.error("Error updating department:", err);
      setError(err.response?.data?.message || "Failed to update department");
    } finally {
      setSaving(false);
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

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Edit Department
            </h1>
            <p className="text-slate-600 text-base md:text-lg">
              Update department information
            </p>
          </div>
          <Button
            onClick={() => router.push("/admin/organization-structure/departments")}
            variant="outline"
          >
            Cancel
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* Form */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900">Department Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Department Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Engineering"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    placeholder="Enter department description..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headPositionId">Head Position ID (Optional)</Label>
                  <Input
                    id="headPositionId"
                    placeholder="MongoDB ObjectId of the head position"
                    value={formData.headPositionId}
                    onChange={(e) => handleInputChange("headPositionId", e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-4">
                <Button
                  type="button"
                  onClick={() => router.push("/admin/organization-structure/departments")}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

